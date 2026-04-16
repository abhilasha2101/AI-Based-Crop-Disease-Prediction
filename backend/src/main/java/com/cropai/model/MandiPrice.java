package com.cropai.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "mandi_prices")
@CompoundIndex(def = "{'crop': 1, 'market': 1, 'date': 1}")
public class MandiPrice {
    @Id
    private String id;

    private String crop;
    private String variety;
    private String market;
    private String district;
    private String state;
    private Double minPrice;
    private Double maxPrice;
    private Double modalPrice;
    private String unit = "Quintal";
    private LocalDate date;
    private LocalDateTime fetchedAt = LocalDateTime.now();
}
