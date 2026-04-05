package com.tcrs.tcrs_backend.dto;


import lombok.Data;
import jakarta.validation.constraints.NotBlank;

public class ComplaintDTO {

    @Data
    public static class CreateRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Description is required")
        private String description;

        @NotBlank(message = "Category is required")
        private String category;

        @NotBlank(message = "Location is required")
        private String location;
    }

    @Data
    public static class UpdateStatusRequest {
        @NotBlank(message = "Status is required")
        private String status; // PENDING, IN_PROGRESS, RESOLVED, REJECTED

        private String adminRemarks;
    }
}
