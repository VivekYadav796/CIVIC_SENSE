package com.tcrs.tcrs_backend.model;


import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    // "CITIZEN", "ADMIN", "AUDITOR", "OFFICIAL"
    private String role;

    // "LOCAL" for email/password, "GOOGLE" for google oauth
    private String authProvider;

    private boolean enabled;

    @CreatedDate
    private LocalDateTime createdAt;

    public String getCreatedAtIST() {
        if (createdAt == null) return null;
        return createdAt.atZone(ZoneId.of("Asia/Kolkata"))
            .format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
    }
}
