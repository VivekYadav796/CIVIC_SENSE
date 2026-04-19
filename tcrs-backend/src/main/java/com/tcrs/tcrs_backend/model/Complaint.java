package com.tcrs.tcrs_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.time.ZoneId;

import java.io.Serializable;


@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Document(collection = "complaints")
public class Complaint implements Serializable{

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    private String title;
    private String description;

    // ROAD, WATER, ELECTRICITY, GARBAGE, SAFETY, OTHER
    private String category;

    private String location;

    // GPS coordinates (optional, set if user allowed GPS)
    private Double latitude;
    private Double longitude;

    // PENDING, IN_PROGRESS, RESOLVED, REJECTED
    private String status;

    // citizen who submitted
    private String submittedByEmail;
    private String submittedByName;

    // official assigned to handle this
    private String assignedOfficialEmail;
    private String assignedOfficialName;

    // admin remarks
    private String adminRemarks;

    // appeal info — citizen can appeal if not satisfied with resolution
    private boolean appealSubmitted;
    private String appealReason;
    private String appealStatus; // PENDING_REVIEW, ACCEPTED, REJECTED
    private LocalDateTime appealSubmittedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Helper: returns IST formatted string for frontend
    public String getCreatedAtIST() {
        if (createdAt == null) return null;
        return createdAt.atZone(ZoneId.of("Asia/Kolkata"))
            .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
    }    
}