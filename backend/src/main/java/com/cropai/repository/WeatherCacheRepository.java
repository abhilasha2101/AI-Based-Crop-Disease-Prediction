package com.cropai.repository;

import com.cropai.model.WeatherCache;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface WeatherCacheRepository extends MongoRepository<WeatherCache, String> {
    Optional<WeatherCache> findByDistrictIgnoreCase(String district);
}
