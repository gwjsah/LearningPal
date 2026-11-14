package com.learningpal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Main entry point for the LearningPal Spring Boot backend application.
 */
@SpringBootApplication
@EntityScan(basePackages = "com.learningpal.entity")
@EnableJpaRepositories(basePackages = "com.learningpal.repository")
public class LearningPalApplication {

    public static void main(String[] args) {
        SpringApplication.run(LearningPalApplication.class, args);
    }
}

