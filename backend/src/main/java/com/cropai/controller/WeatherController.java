package com.cropai.controller;

import com.cropai.dto.ApiResponse;
import com.cropai.model.WeatherCache;
import com.cropai.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/{district}")
    public ResponseEntity<ApiResponse<WeatherCache>> getWeather(@PathVariable String district) {
        WeatherCache weather = weatherService.getWeatherForDistrict(district);
        return ResponseEntity.ok(ApiResponse.success(weather));
    }

    @GetMapping("/districts")
    public ResponseEntity<ApiResponse<List<String>>> getDistricts() {
        return ResponseEntity.ok(ApiResponse.success(weatherService.getAvailableDistricts()));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<WeatherCache>>> getAllWeather() {
        return ResponseEntity.ok(ApiResponse.success(weatherService.getAllDistrictsWeather()));
    }
}
