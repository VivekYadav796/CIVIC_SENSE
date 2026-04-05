package com.tcrs.tcrs_backend.controller;


import com.tcrs.tcrs_backend.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    // Step 1: user enters email → send OTP
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body("Email is required");

        String result = passwordResetService.sendOtp(email);
        return switch (result) {
            case "NOT_FOUND" -> ResponseEntity.status(404).body("No account found with this email");
            case "SENT"      -> ResponseEntity.ok("OTP sent to your email");
            default          -> ResponseEntity.status(500).body("Failed to send OTP");
        };
    }

    // Step 2: verify OTP (used to unlock the reset form)
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp   = body.get("otp");

        String result = passwordResetService.verifyOtp(email, otp);
        return switch (result) {
            case "VALID"        -> ResponseEntity.ok("OTP verified");
            case "INVALID"      -> ResponseEntity.status(400).body("Incorrect OTP");
            case "EXPIRED"      -> ResponseEntity.status(400).body("OTP has expired. Please request a new one.");
            case "ALREADY_USED" -> ResponseEntity.status(400).body("OTP already used");
            default             -> ResponseEntity.status(404).body("No OTP found for this email");
        };
    }

    // Step 3: reset password
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email       = body.get("email");
        String otp         = body.get("otp");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 6)
            return ResponseEntity.badRequest().body("Password must be at least 6 characters");

        String result = passwordResetService.resetPassword(email, otp, newPassword);
        return switch (result) {
            case "SUCCESS"      -> ResponseEntity.ok("Password reset successfully");
            case "INVALID"      -> ResponseEntity.status(400).body("Incorrect OTP");
            case "EXPIRED"      -> ResponseEntity.status(400).body("OTP expired");
            case "ALREADY_USED" -> ResponseEntity.status(400).body("OTP already used");
            default             -> ResponseEntity.status(404).body("User not found");
        };
    }
}
