package com.tcrs.tcrs_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication
public class TcrsBackendApplication {

    @Value("${spring.data.mongodb.uri:NOT_FOUND}")
    private String mongoUri;

    public static void main(String[] args) {
        SpringApplication.run(TcrsBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner logMongoUri() {
        return args -> {
            System.out.println("=========================================================");
            System.out.println("CRITICAL DEBUG: Loaded MongoDB URI is: " + mongoUri);
            System.out.println("=========================================================");
        };
    }
}
