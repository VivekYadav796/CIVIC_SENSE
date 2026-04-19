package com.tcrs.tcrs_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
 
import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
 
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Document(collection = "suggestions")
public class Suggestion implements Serializable {
 
    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    private String title;
    private String description;

    // category: INFRASTRUCTURE, PROCESS, APP, OTHER
    private String category;

    private String submittedByEmail;
    private String submittedByName;

    // OPEN, UNDER_REVIEW, IMPLEMENTED, CLOSED
    private String status;

    // admin response
    private String adminResponse;

    @CreatedDate
    private LocalDateTime createdAt;

    public String getCreatedAtIST() {
        if (createdAt == null) return null;
        return createdAt.atZone(ZoneId.of("Asia/Kolkata"))
            .format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
    }
}