package com.tcrs.tcrs_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

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
}