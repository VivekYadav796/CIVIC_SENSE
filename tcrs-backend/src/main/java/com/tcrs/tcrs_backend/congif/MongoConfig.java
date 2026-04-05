package com.tcrs.tcrs_backend.congif;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
//import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

@Configuration
@EnableMongoAuditing(dateTimeProviderRef = "istDateTimeProvider")
public class MongoConfig {

    // Forces all @CreatedDate and @LastModifiedDate to use IST (UTC+5:30)
    @Bean
    public DateTimeProvider istDateTimeProvider() {
        return () -> Optional.of(
            ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime()
        );
    }
}
