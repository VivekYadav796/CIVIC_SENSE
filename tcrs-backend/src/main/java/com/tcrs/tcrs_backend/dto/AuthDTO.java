package com.tcrs.tcrs_backend.dto;


import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// ── Auth DTOs ──────────────────────────────────────────

public class AuthDTO {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @Email(message = "Invalid email")
        @NotBlank(message = "Email is required")
        private String email;

        @Size(min = 6, message = "Password must be at least 6 characters")
        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    public static class GoogleRequest {
        private String email;
        private String name;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String role;
        private String name;
        private String email;

        public AuthResponse(String token, String role, String name, String email) {
            this.token = token;
            this.role = role;
            this.name = name;
            this.email = email;
        }
    }
}


/*
AuthDTO = Authentication Data Transfer Object

DTO stands for Data Transfer Object
It’s just a simple class used to send/receive data
Used between:
Frontend ↔ Backend
Controller ↔ Service

Entity = Full database record
DTO = Only needed fields (like a form)
*/
