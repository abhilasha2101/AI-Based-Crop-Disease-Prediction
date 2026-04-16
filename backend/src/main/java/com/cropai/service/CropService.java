package com.cropai.service;

import com.cropai.model.DiseaseResult;
import com.cropai.model.CropUpload;
import com.cropai.repository.CropUploadRepository;
import com.cropai.repository.DiseaseResultRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class CropService {

    private final WebClient webClient;
    private final CropUploadRepository uploadRepository;
    private final DiseaseResultRepository resultRepository;
    private final String uploadDir;

    public CropService(CropUploadRepository uploadRepository,
                       DiseaseResultRepository resultRepository,
                       @Value("${app.ml-service.url}") String mlServiceUrl,
                       @Value("${app.upload.dir}") String uploadDir) {
        this.webClient = WebClient.builder().baseUrl(mlServiceUrl).build();
        this.uploadRepository = uploadRepository;
        this.resultRepository = resultRepository;
        this.uploadDir = uploadDir;
    }

    public Map<String, Object> uploadAndDetect(String userId, String cropType,
                                                MultipartFile file) throws IOException {
        // Save file locally
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.write(filePath, file.getBytes());

        // Save upload record
        CropUpload upload = new CropUpload();
        upload.setUserId(userId);
        upload.setCropType(cropType);
        upload.setImagePath(fileName);
        upload.setOriginalFileName(file.getOriginalFilename());
        upload.setFileSize(file.getSize());
        upload = uploadRepository.save(upload);

        // Call ML service for image classification
        Map<String, Object> mlResponse;
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("crop", cropType);
            builder.part("image", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            }).contentType(MediaType.IMAGE_JPEG);

            mlResponse = webClient.post()
                    .uri("/predict/image")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            mlResponse = Map.of(
                    "success", false,
                    "data", Map.of(
                            "disease_name", "Service Unavailable",
                            "confidence", 0.0,
                            "treatment", "ML service is currently unavailable. Please try again later.",
                            "risk_level", "UNKNOWN"
                    )
            );
        }

        // Save disease result
        Map<String, Object> data = (Map<String, Object>) mlResponse.getOrDefault("data", Map.of());
        DiseaseResult result = new DiseaseResult();
        result.setUploadId(upload.getId());
        result.setUserId(userId);
        result.setCropType(cropType);
        result.setPredictionType("IMAGE");
        result.setDiseaseName((String) data.getOrDefault("disease_name", "Unknown"));
        result.setConfidence(((Number) data.getOrDefault("confidence", 0.0)).doubleValue());
        result.setTreatment((String) data.getOrDefault("treatment", ""));
        result.setRiskLevel((String) data.getOrDefault("risk_level", "UNKNOWN"));
        result.setPredictionMethod("CNN");
        result = resultRepository.save(result);

        return Map.of(
                "upload", upload,
                "result", result,
                "mlResponse", data
        );
    }

    public Map<String, Object> predictByWeather(String userId, String cropType,
                                                 Double temp, Double humidity,
                                                 Double rainfall, Double waterDepth) {
        // Call ML service for weather prediction
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("crop", cropType);
        requestBody.put("temperature", temp);
        requestBody.put("humidity", humidity);
        requestBody.put("rainfall", rainfall);
        requestBody.put("water_depth", waterDepth != null ? waterDepth : 0.0);

        Map<String, Object> mlResponse;
        try {
            mlResponse = webClient.post()
                    .uri("/predict/weather")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            mlResponse = Map.of(
                    "success", false,
                    "data", Map.of(
                            "disease_name", "Service Unavailable",
                            "confidence", 0.0,
                            "treatment", "ML service is currently unavailable.",
                            "risk_level", "UNKNOWN"
                    )
            );
        }

        Map<String, Object> data = (Map<String, Object>) mlResponse.getOrDefault("data", Map.of());

        // Save result
        DiseaseResult result = new DiseaseResult();
        result.setUserId(userId);
        result.setCropType(cropType);
        result.setPredictionType("WEATHER");
        result.setDiseaseName((String) data.getOrDefault("disease_name", "Unknown"));
        result.setConfidence(((Number) data.getOrDefault("confidence", 0.0)).doubleValue());
        result.setTreatment((String) data.getOrDefault("treatment", ""));
        result.setRiskLevel((String) data.getOrDefault("risk_level", "UNKNOWN"));
        result.setPredictionMethod((String) data.getOrDefault("prediction_method", "UNKNOWN"));
        result.setWeatherData(Map.of(
                "temperature", temp,
                "humidity", humidity,
                "rainfall", rainfall
        ));
        result.setAllRisks((List<Map<String, Object>>) data.getOrDefault("all_risks", List.of()));
        result = resultRepository.save(result);

        return Map.of(
                "result", result,
                "mlResponse", data
        );
    }

    public List<CropUpload> getUserUploads(String userId) {
        return uploadRepository.findByUserIdOrderByUploadedAtDesc(userId);
    }

    public List<DiseaseResult> getUserResults(String userId) {
        return resultRepository.findByUserIdOrderByPredictedAtDesc(userId);
    }
}
