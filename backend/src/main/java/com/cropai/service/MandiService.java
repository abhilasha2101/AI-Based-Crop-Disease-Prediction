package com.cropai.service;

import com.cropai.model.MandiPrice;
import com.cropai.repository.MandiPriceRepository;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.*;

@Service
public class MandiService {

    private final MandiPriceRepository priceRepository;

    public MandiService(MandiPriceRepository priceRepository) {
        this.priceRepository = priceRepository;
    }

    @PostConstruct
    public void initSampleData() {
        if (priceRepository.count() == 0) {
            seedMandiPrices();
        }
    }

    public List<MandiPrice> getPricesByCrop(String crop) {
        return priceRepository.findByCropIgnoreCaseOrderByDateDesc(crop);
    }

    public List<MandiPrice> getPricesByCropAndState(String crop, String state) {
        return priceRepository.findByCropIgnoreCaseAndStateIgnoreCaseOrderByDateDesc(crop, state);
    }

    public List<MandiPrice> getTrend(String crop, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return priceRepository.findByCropIgnoreCaseAndDateBetweenOrderByDateAsc(crop, start, end);
    }

    public List<MandiPrice> getLatestPrices(String crop) {
        return priceRepository.findTop10ByCropIgnoreCaseOrderByDateDesc(crop);
    }

    public Map<String, Object> getAllCropsSummary() {
        String[] crops = {"Rice", "Tea", "Makhana", "Potato"};
        Map<String, Object> summary = new HashMap<>();

        for (String crop : crops) {
            List<MandiPrice> latest = priceRepository.findTop10ByCropIgnoreCaseOrderByDateDesc(crop);
            if (!latest.isEmpty()) {
                MandiPrice recent = latest.get(0);
                double avgPrice = latest.stream()
                        .mapToDouble(MandiPrice::getModalPrice)
                        .average().orElse(0);
                summary.put(crop.toLowerCase(), Map.of(
                        "latest", recent,
                        "averagePrice", Math.round(avgPrice * 100.0) / 100.0,
                        "totalRecords", latest.size()
                ));
            }
        }
        return summary;
    }

    private void seedMandiPrices() {
        List<MandiPrice> prices = new ArrayList<>();
        Random rand = new Random(42);

        // Rice prices
        String[][] riceMarkets = {
                {"Azadpur", "New Delhi", "Delhi"},
                {"Patna", "Patna", "Bihar"},
                {"Kolkata", "Kolkata", "West Bengal"},
                {"Lucknow", "Lucknow", "Uttar Pradesh"},
        };
        for (int d = 0; d < 30; d++) {
            for (String[] market : riceMarkets) {
                MandiPrice p = new MandiPrice();
                p.setCrop("Rice");
                p.setVariety("Basmati");
                p.setMarket(market[0]);
                p.setDistrict(market[1]);
                p.setState(market[2]);
                double base = 2800 + rand.nextDouble() * 500;
                p.setMinPrice(Math.round(base * 0.9 * 100.0) / 100.0);
                p.setMaxPrice(Math.round(base * 1.1 * 100.0) / 100.0);
                p.setModalPrice(Math.round(base * 100.0) / 100.0);
                p.setDate(LocalDate.now().minusDays(d));
                prices.add(p);
            }
        }

        // Tea prices
        String[][] teaMarkets = {
                {"Siliguri", "Darjeeling", "West Bengal"},
                {"Guwahati", "Kamrup", "Assam"},
                {"Dibrugarh", "Dibrugarh", "Assam"},
                {"Kochi", "Ernakulam", "Kerala"},
        };
        for (int d = 0; d < 30; d++) {
            for (String[] market : teaMarkets) {
                MandiPrice p = new MandiPrice();
                p.setCrop("Tea");
                p.setVariety("CTC");
                p.setMarket(market[0]);
                p.setDistrict(market[1]);
                p.setState(market[2]);
                double base = 18000 + rand.nextDouble() * 5000;
                p.setMinPrice(Math.round(base * 0.9 * 100.0) / 100.0);
                p.setMaxPrice(Math.round(base * 1.1 * 100.0) / 100.0);
                p.setModalPrice(Math.round(base * 100.0) / 100.0);
                p.setDate(LocalDate.now().minusDays(d));
                prices.add(p);
            }
        }

        // Makhana prices
        String[][] makhanaMarkets = {
                {"Darbhanga", "Darbhanga", "Bihar"},
                {"Madhubani", "Madhubani", "Bihar"},
                {"Saharsa", "Saharsa", "Bihar"},
                {"Purnia", "Purnia", "Bihar"},
        };
        for (int d = 0; d < 30; d++) {
            for (String[] market : makhanaMarkets) {
                MandiPrice p = new MandiPrice();
                p.setCrop("Makhana");
                p.setVariety("Fox Nut");
                p.setMarket(market[0]);
                p.setDistrict(market[1]);
                p.setState(market[2]);
                double base = 8000 + rand.nextDouble() * 3000;
                p.setMinPrice(Math.round(base * 0.9 * 100.0) / 100.0);
                p.setMaxPrice(Math.round(base * 1.1 * 100.0) / 100.0);
                p.setModalPrice(Math.round(base * 100.0) / 100.0);
                p.setDate(LocalDate.now().minusDays(d));
                prices.add(p);
            }
        }

        // Potato prices
        String[][] potatoMarkets = {
                {"Azadpur", "New Delhi", "Delhi"},
                {"Agra", "Agra", "Uttar Pradesh"},
                {"Hooghly", "Hooghly", "West Bengal"},
                {"Patna", "Patna", "Bihar"},
        };
        for (int d = 0; d < 30; d++) {
            for (String[] market : potatoMarkets) {
                MandiPrice p = new MandiPrice();
                p.setCrop("Potato");
                p.setVariety("Jyoti");
                p.setMarket(market[0]);
                p.setDistrict(market[1]);
                p.setState(market[2]);
                double base = 1200 + rand.nextDouble() * 600;
                p.setMinPrice(Math.round(base * 0.9 * 100.0) / 100.0);
                p.setMaxPrice(Math.round(base * 1.1 * 100.0) / 100.0);
                p.setModalPrice(Math.round(base * 100.0) / 100.0);
                p.setDate(LocalDate.now().minusDays(d));
                prices.add(p);
            }
        }

        priceRepository.saveAll(prices);
        System.out.println("✅ Seeded " + prices.size() + " mandi price records");
    }
}
