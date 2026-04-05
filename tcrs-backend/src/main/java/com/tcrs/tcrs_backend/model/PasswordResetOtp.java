package com.tcrs.tcrs_backend.model;


import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "password_reset_otps")
public class PasswordResetOtp {

    @Id
    private String id;

    private String email;
    private String otp;           // 6-digit code
    private boolean used;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    public PasswordResetOtp(String email, String otp, int expiryMinutes) {
        this.email     = email;
        this.otp       = otp;
        this.used      = false;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(expiryMinutes);
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}