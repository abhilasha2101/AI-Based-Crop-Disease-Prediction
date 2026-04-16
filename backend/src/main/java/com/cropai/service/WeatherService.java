package com.cropai.service;

import com.cropai.model.WeatherCache;
import com.cropai.repository.WeatherCacheRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class WeatherService {

    private final WebClient webClient;
    private final WeatherCacheRepository cacheRepository;
    private final String apiKey;

    // Major districts in India for weather data
    private static final Map<String, double[]> DISTRICT_COORDS = Map.ofEntries(
            Map.entry("Patna", new double[]{25.6093, 85.1376}),
            Map.entry("Muzaffarpur", new double[]{26.1209, 85.3647}),
            Map.entry("Darbhanga", new double[]{26.1542, 85.8918}),
            Map.entry("Begusarai", new double[]{25.4182, 86.1272}),
            Map.entry("Saharsa", new double[]{25.8779, 86.5944}),
            Map.entry("Madhubani", new double[]{26.3569, 86.0718}),
            Map.entry("Purnia", new double[]{25.7771, 87.4753}),
            Map.entry("Kolkata", new double[]{22.5726, 88.3639}),
            Map.entry("Lucknow", new double[]{26.8467, 80.9462}),
            Map.entry("Delhi", new double[]{28.7041, 77.1025}),
            Map.entry("Mumbai", new double[]{19.0760, 72.8777}),
            Map.entry("Chennai", new double[]{13.0827, 80.2707}),
            Map.entry("Bangalore", new double[]{12.9716, 77.5946}),
            Map.entry("Hyderabad", new double[]{17.3850, 78.4867}),
            Map.entry("Jaipur", new double[]{26.9124, 75.7873}),
            Map.entry("Bhopal", new double[]{23.2599, 77.4126}),
            Map.entry("Ranchi", new double[]{23.3441, 85.3096}),
            Map.entry("Guwahati", new double[]{26.1445, 91.7362}),
            Map.entry("Dibrugarh", new double[]{27.4728, 94.9120}),
            Map.entry("Jorhat", new double[]{26.7509, 94.2037}),
            Map.entry("Siliguri", new double[]{26.7271, 88.3953}),
            Map.entry("Darjeeling", new double[]{27.0410, 88.2663}),
            Map.entry("Varanasi", new double[]{25.3176, 82.9739}),
            Map.entry("Nagpur", new double[]{21.1458, 79.0882}),
            Map.entry("Pune", new double[]{18.5204, 73.8567}),
            Map.entry("Ahmedabad", new double[]{23.0225, 72.5714}),
            Map.entry("Chandigarh", new double[]{30.7333, 76.7794}),
            Map.entry("Dehradun", new double[]{30.3165, 78.0322}),
            Map.entry("Shimla", new double[]{31.1048, 77.1734}),
            Map.entry("Kochi", new double[]{9.9312, 76.2673})
    );

    public WeatherService(WeatherCacheRepository cacheRepository,
                           @Value("${app.weather.api-key}") String apiKey,
                           @Value("${app.weather.base-url}") String baseUrl) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
        this.cacheRepository = cacheRepository;
        this.apiKey = apiKey;
    }

    public WeatherCache getWeatherForDistrict(String district) {
        // Check cache first (6-hour TTL)
        Optional<WeatherCache> cached = cacheRepository.findByDistrictIgnoreCase(district);
        if (cached.isPresent() && cached.get().getExpiresAt().isAfter(LocalDateTime.now())) {
            return cached.get();
        }

        // Fetch from API
        double[] coords = DISTRICT_COORDS.getOrDefault(district,
                DISTRICT_COORDS.getOrDefault("Patna", new double[]{25.6093, 85.1376}));

        try {
            Map<String, Object> response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/weather")
                            .queryParam("lat", coords[0])
                            .queryParam("lon", coords[1])
                            .queryParam("appid", apiKey)
                            .queryParam("units", "metric")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null) {
                WeatherCache weather = parseWeatherResponse(response, district);
                cacheRepository.save(weather);
                return weather;
            }
        } catch (Exception e) {
            // Return simulated data if API fails
            return getSimulatedWeather(district);
        }

        return getSimulatedWeather(district);
    }

    public List<WeatherCache> getAllDistrictsWeather() {
        List<WeatherCache> results = new ArrayList<>();
        for (String district : DISTRICT_COORDS.keySet()) {
            results.add(getWeatherForDistrict(district));
        }
        return results;
    }

    public List<String> getAvailableDistricts() {
        return new ArrayList<>(DISTRICT_COORDS.keySet());
    }

    private WeatherCache parseWeatherResponse(Map<String, Object> response, String district) {
        Map<String, Object> main = (Map<String, Object>) response.get("main");
        List<Map<String, Object>> weatherList = (List<Map<String, Object>>) response.get("weather");
        Map<String, Object> wind = (Map<String, Object>) response.get("wind");

        WeatherCache weather = new WeatherCache();
        weather.setDistrict(district);
        weather.setState(getStateForDistrict(district));
        double[] coords = DISTRICT_COORDS.getOrDefault(district, new double[]{0, 0});
        weather.setLatitude(coords[0]);
        weather.setLongitude(coords[1]);
        weather.setTemperature(((Number) main.get("temp")).doubleValue());
        weather.setHumidity(((Number) main.get("humidity")).doubleValue());

        // Rainfall from rain object if present
        Map<String, Object> rain = (Map<String, Object>) response.get("rain");
        weather.setRainfall(rain != null ? ((Number) rain.getOrDefault("1h", 0)).doubleValue() : 0.0);

        weather.setWindSpeed(wind != null ? ((Number) wind.getOrDefault("speed", 0)).doubleValue() : 0.0);
        weather.setDescription(weatherList != null && !weatherList.isEmpty() ?
                (String) weatherList.get(0).get("description") : "N/A");
        weather.setIcon(weatherList != null && !weatherList.isEmpty() ?
                (String) weatherList.get(0).get("icon") : "01d");

        weather.setFetchedAt(LocalDateTime.now());
        weather.setExpiresAt(LocalDateTime.now().plusHours(6));

        return weather;
    }

    private WeatherCache getSimulatedWeather(String district) {
        Random rand = new Random(district.hashCode());
        WeatherCache weather = new WeatherCache();
        weather.setDistrict(district);
        weather.setState(getStateForDistrict(district));
        double[] coords = DISTRICT_COORDS.getOrDefault(district, new double[]{25.0, 85.0});
        weather.setLatitude(coords[0]);
        weather.setLongitude(coords[1]);
        weather.setTemperature(20 + rand.nextDouble() * 20);
        weather.setHumidity(40 + rand.nextDouble() * 50);
        weather.setRainfall(rand.nextDouble() * 30);
        weather.setWindSpeed(2 + rand.nextDouble() * 15);
        weather.setDescription("Simulated weather data");
        weather.setIcon("02d");
        weather.setFetchedAt(LocalDateTime.now());
        weather.setExpiresAt(LocalDateTime.now().plusHours(6));
        return weather;
    }

    private String getStateForDistrict(String district) {
        Map<String, String> districtState = Map.ofEntries(
                Map.entry("Patna", "Bihar"), Map.entry("Muzaffarpur", "Bihar"),
                Map.entry("Darbhanga", "Bihar"), Map.entry("Begusarai", "Bihar"),
                Map.entry("Saharsa", "Bihar"), Map.entry("Madhubani", "Bihar"),
                Map.entry("Purnia", "Bihar"), Map.entry("Kolkata", "West Bengal"),
                Map.entry("Lucknow", "Uttar Pradesh"), Map.entry("Delhi", "Delhi"),
                Map.entry("Mumbai", "Maharashtra"), Map.entry("Chennai", "Tamil Nadu"),
                Map.entry("Bangalore", "Karnataka"), Map.entry("Hyderabad", "Telangana"),
                Map.entry("Jaipur", "Rajasthan"), Map.entry("Bhopal", "Madhya Pradesh"),
                Map.entry("Ranchi", "Jharkhand"), Map.entry("Guwahati", "Assam"),
                Map.entry("Dibrugarh", "Assam"), Map.entry("Jorhat", "Assam"),
                Map.entry("Siliguri", "West Bengal"), Map.entry("Darjeeling", "West Bengal"),
                Map.entry("Varanasi", "Uttar Pradesh"), Map.entry("Nagpur", "Maharashtra"),
                Map.entry("Pune", "Maharashtra"), Map.entry("Ahmedabad", "Gujarat"),
                Map.entry("Chandigarh", "Chandigarh"), Map.entry("Dehradun", "Uttarakhand"),
                Map.entry("Shimla", "Himachal Pradesh"), Map.entry("Kochi", "Kerala")
        );
        return districtState.getOrDefault(district, "Unknown");
    }
}
