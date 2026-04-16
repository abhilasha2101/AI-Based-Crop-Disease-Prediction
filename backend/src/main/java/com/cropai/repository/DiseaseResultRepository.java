package com.cropai.repository;

import com.cropai.model.DiseaseResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface DiseaseResultRepository extends MongoRepository<DiseaseResult, String> {
    List<DiseaseResult> findByUserIdOrderByPredictedAtDesc(String userId);
    List<DiseaseResult> findByUploadId(String uploadId);
    long countByUserId(String userId);
    long countByUserIdAndRiskLevel(String userId, String riskLevel);
}
