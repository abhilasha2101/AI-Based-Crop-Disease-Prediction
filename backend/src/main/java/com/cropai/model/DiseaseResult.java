package com.cropai.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "disease_results")
public class DiseaseResult {
    @Id
    private String id;

    private String uploadId;

    @Indexed
    private String userId;

    private String cropType;
    private String predictionType; // IMAGE or WEATHER

    private String diseaseName;
    private Double confidence;
    private String treatment;
    private String riskLevel;

    private Map<String, Object> weatherData;
    private List<Map<String, Object>> allRisks;

    private String predictionMethod;
    private LocalDateTime predictedAt = LocalDateTime.now();
}
