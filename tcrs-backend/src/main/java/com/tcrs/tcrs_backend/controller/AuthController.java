package com.tcrs.tcrs_backend.controller;


import com.tcrs.tcrs_backend.dto.AuthDTO;
import com.tcrs.tcrs_backend.model.User;
import com.tcrs.tcrs_backend.repository.UserRepository;
import com.tcrs.tcrs_backend.service.AuditLogService;
import com.tcrs.tcrs_backend.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuditLogService auditLogService;

    // ── Register ───────────────────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDTO.RegisterRequest req) {

        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole("CITIZEN");           // always citizen — admins set manually
        user.setAuthProvider("LOCAL");
        user.setEnabled(true);

        userRepository.save(user);

        auditLogService.log(
            req.getEmail(),
            "USER_REGISTERED",
            "USER",
            user.getId(),
            user.getName() + " registered as CITIZEN"
        );

        return ResponseEntity.ok("Registered successfully");
    }

    // ── Login ──────────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDTO.LoginRequest req) {

        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("No account found with this email");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Incorrect password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        auditLogService.log(
            user.getEmail(),
            "USER_LOGIN",
            "USER",
            user.getId(),
            user.getName() + " logged in"
        );

        return ResponseEntity.ok(
            new AuthDTO.AuthResponse(token, user.getRole(), user.getName(), user.getEmail())
        );
    }

    // ── Google OAuth ───────────────────────────────────────────────────────────
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody AuthDTO.GoogleRequest req) {

        if (req.getEmail() == null || req.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        Optional<User> existing = userRepository.findByEmail(req.getEmail());
        User user;

        if (existing.isPresent()) {
            // user already exists — just log them in
            user = existing.get();
        } else {
            // first time Google login — create citizen account automatically
            user = new User();
            user.setName(req.getName());
            user.setEmail(req.getEmail());
            user.setPassword(passwordEncoder.encode("GOOGLE_" + req.getEmail()));
            user.setRole("CITIZEN");
            user.setAuthProvider("GOOGLE");
            user.setEnabled(true);
            userRepository.save(user);

            auditLogService.log(
                req.getEmail(),
                "USER_REGISTERED",
                "USER",
                user.getId(),
                user.getName() + " registered via Google as CITIZEN"
            );
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return ResponseEntity.ok(
            new AuthDTO.AuthResponse(token, user.getRole(), user.getName(), user.getEmail())
        );
    }

    // ── Health check ───────────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        String role  = jwtUtil.extractRole(token);
        return ResponseEntity.ok(new AuthDTO.AuthResponse(token, role, email, email));
    }
}
