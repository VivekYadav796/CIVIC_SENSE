package com.tcrs.tcrs_backend.congif;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {

        // Build a fully configured ObjectMapper for Redis serialization
        ObjectMapper mapper = new ObjectMapper();

        // Handle Java 8 date/time types (LocalDateTime etc.)
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Make all fields visible — needed for MongoDB model classes
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);

        // Store type info so Redis knows how to deserialize back to the right class
        // OBJECT_AND_NON_CONCRETE is safer than NON_FINAL — avoids issues with
        // List<Complaint> where element type needs to be preserved
        mapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.OBJECT_AND_NON_CONCRETE,
            JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer jsonSerializer =
            new GenericJackson2JsonRedisSerializer(mapper);

        // Default cache config
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer)
            )
            .disableCachingNullValues()
            .entryTtl(Duration.ofMinutes(5));

        // Per-cache TTL overrides
        Map<String, RedisCacheConfiguration> cacheMap = Map.of(
            "stats",              defaultConfig.entryTtl(Duration.ofMinutes(5)),
            "complaints",         defaultConfig.entryTtl(Duration.ofMinutes(3)),
            "officials",          defaultConfig.entryTtl(Duration.ofMinutes(10)),
            "suggestions",        defaultConfig.entryTtl(Duration.ofMinutes(5)),
            "auditLogs",          defaultConfig.entryTtl(Duration.ofMinutes(2)),
            "nearbyComplaints",   defaultConfig.entryTtl(Duration.ofMinutes(1))
        );

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheMap)
            .build();
    }
}