package com.cropai.controller;

import com.cropai.dto.ApiResponse;
import com.cropai.model.User;
import com.cropai.repository.CropUploadRepository;
import com.cropai.repository.DiseaseResultRepository;
import com.cropai.service.AuthService;
import com.cropai.service.CropService;
import com.cropai.service.MandiService;
import com.cropai.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final AuthService authService;
    private final CropService cropService;
    private final WeatherService weatherService;
    private final MandiService mandiService;
    private final CropUploadRepository uploadRepository;
    private final DiseaseResultRepository resultRepository;

    public DashboardController(AuthService authService, CropService cropService,
                               WeatherService weatherService, MandiService mandiService,
                               CropUploadRepository uploadRepository,
                               DiseaseResultRepository resultRepository) {
        this.authService = authService;
        this.cropService = cropService;
        this.weatherService = weatherService;
        this.mandiService = mandiService;
        this.uploadRepository = uploadRepository;
        this.resultRepository = resultRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        User user = authService.getUserById(userId);

        Map<String, Object> dashboard = new HashMap<>();

        // User info
        dashboard.put("user", Map.of(
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        ));

        // Statistics
        dashboard.put("stats", Map.of(
                "totalUploads", uploadRepository.countByUserId(userId),
                "totalPredictions", resultRepository.countByUserId(userId),
                "highRiskCount", resultRepository.countByUserIdAndRiskLevel(userId, "HIGH")
        ));

        // Recent results
        dashboard.put("recentResults", cropService.getUserResults(userId).stream()
                .limit(5).toList());

        // Recent uploads
        dashboard.put("recentUploads", cropService.getUserUploads(userId).stream()
                .limit(5).toList());

        // Weather summary (Patna as default)
        dashboard.put("weather", weatherService.getWeatherForDistrict("Patna"));

        // Mandi summary
        dashboard.put("mandiSummary", mandiService.getAllCropsSummary());

        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }
}
