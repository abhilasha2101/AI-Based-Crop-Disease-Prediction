package com.cropai.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "weather_cache")
public class WeatherCache {
    @Id
    private String id;

    @Indexed(unique = true)
    private String district;

    private String state;
    private Double latitude;
    private Double longitude;
    private Double temperature;
    private Double humidity;
    private Double rainfall;
    private Double windSpeed;
    private String description;
    private String icon;
    private LocalDateTime fetchedAt = LocalDateTime.now();

    @Indexed(expireAfterSeconds = 0)
    private LocalDateTime expiresAt;
}
