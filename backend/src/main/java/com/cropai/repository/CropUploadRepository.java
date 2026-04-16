package com.cropai.repository;

import com.cropai.model.CropUpload;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CropUploadRepository extends MongoRepository<CropUpload, String> {
    List<CropUpload> findByUserIdOrderByUploadedAtDesc(String userId);
    long countByUserId(String userId);
}
