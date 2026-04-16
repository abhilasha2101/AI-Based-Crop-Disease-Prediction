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
@Document(collection = "crop_uploads")
public class CropUpload {
    @Id
    private String id;

    @Indexed
    private String userId;

    private String cropType;
    private String imagePath;
    private String originalFileName;
    private Long fileSize;
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
