package com.cropai.controller;

import com.cropai.dto.ApiResponse;
import com.cropai.model.MandiPrice;
import com.cropai.service.MandiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mandi")
public class MandiController {

    private final MandiService mandiService;

    public MandiController(MandiService mandiService) {
        this.mandiService = mandiService;
    }

    @GetMapping("/prices")
    public ResponseEntity<ApiResponse<List<MandiPrice>>> getPrices(
            @RequestParam String crop,
            @RequestParam(required = false) String state) {
        List<MandiPrice> prices;
        if (state != null && !state.isEmpty()) {
            prices = mandiService.getPricesByCropAndState(crop, state);
        } else {
            prices = mandiService.getPricesByCrop(crop);
        }
        return ResponseEntity.ok(ApiResponse.success(prices));
    }

    @GetMapping("/trends")
    public ResponseEntity<ApiResponse<List<MandiPrice>>> getTrends(
            @RequestParam String crop,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(mandiService.getTrend(crop, days)));
    }

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<List<MandiPrice>>> getLatest(@RequestParam String crop) {
        return ResponseEntity.ok(ApiResponse.success(mandiService.getLatestPrices(crop)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(mandiService.getAllCropsSummary()));
    }
}
