package com.tcrs.tcrs_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
 
import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Document(collection = "audit_logs")
public class AuditLog implements Serializable {
 
    private static final long serialVersionUID = 1L;
 
    @Id
    private String id;

    // who performed the action
    private String performedByEmail;

    // what action was performed e.g. "COMPLAINT_CREATED", "STATUS_UPDATED",
    // "USER_REGISTERED"
    private String action;

    // which entity was affected
    private String entityType; // "COMPLAINT", "USER"
    private String entityId;

    // human-readable description
    private String description;

    @CreatedDate
    private LocalDateTime createdAt;

    public String getCreatedAtIST() {
        if (createdAt == null) return null;
        return createdAt.atZone(ZoneId.of("Asia/Kolkata"))
            .format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
    }
}