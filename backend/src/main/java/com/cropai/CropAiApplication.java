package com.cropai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CropAiApplication {
    public static void main(String[] args) {
        SpringApplication.run(CropAiApplication.class, args);
    }
}
