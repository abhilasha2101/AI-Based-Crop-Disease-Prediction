package com.cropai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WeatherPredictionRequest {
    @NotBlank(message = "Crop type is required")
    private String crop;

    @NotNull(message = "Temperature is required")
    private Double temperature;

    @NotNull(message = "Humidity is required")
    private Double humidity;

    @NotNull(message = "Rainfall is required")
    private Double rainfall;

    private Double waterDepth = 0.0;
}
