package com.cropai.repository;

import com.cropai.model.MandiPrice;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface MandiPriceRepository extends MongoRepository<MandiPrice, String> {
    List<MandiPrice> findByCropIgnoreCaseOrderByDateDesc(String crop);
    List<MandiPrice> findByCropIgnoreCaseAndStateIgnoreCaseOrderByDateDesc(String crop, String state);
    List<MandiPrice> findByCropIgnoreCaseAndDateBetweenOrderByDateAsc(String crop, LocalDate start, LocalDate end);
    List<MandiPrice> findTop10ByCropIgnoreCaseOrderByDateDesc(String crop);
}
