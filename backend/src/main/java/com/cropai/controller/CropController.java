package com.cropai.controller;

import com.cropai.dto.ApiResponse;
import com.cropai.dto.WeatherPredictionRequest;
import com.cropai.service.CropService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/crop")
public class CropController {

    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadAndDetect(
            Authentication auth,
            @RequestParam("crop") String crop,
            @RequestParam("image") MultipartFile image) {
        try {
            String userId = (String) auth.getPrincipal();
            Map<String, Object> result = cropService.uploadAndDetect(userId, crop, image);
            return ResponseEntity.ok(ApiResponse.success("Image analyzed successfully", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    @PostMapping("/predict")
    public ResponseEntity<ApiResponse<Map<String, Object>>> predictByWeather(
            Authentication auth,
            @Valid @RequestBody WeatherPredictionRequest request) {
        try {
            String userId = (String) auth.getPrincipal();
            Map<String, Object> result = cropService.predictByWeather(
                    userId, request.getCrop(),
                    request.getTemperature(), request.getHumidity(),
                    request.getRainfall(), request.getWaterDepth()
            );
            return ResponseEntity.ok(ApiResponse.success("Prediction completed", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Prediction failed: " + e.getMessage()));
        }
    }

    @GetMapping("/uploads")
    public ResponseEntity<ApiResponse<?>> getUserUploads(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(cropService.getUserUploads(userId)));
    }

    @GetMapping("/results")
    public ResponseEntity<ApiResponse<?>> getUserResults(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(cropService.getUserResults(userId)));
    }
}
