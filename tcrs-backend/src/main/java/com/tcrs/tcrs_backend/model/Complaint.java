package com.tcrs.tcrs_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "complaints")
public class Complaint {

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
}