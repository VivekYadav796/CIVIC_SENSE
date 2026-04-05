package com.tcrs.tcrs_backend.controller;

import com.tcrs.tcrs_backend.model.Suggestion;
import com.tcrs.tcrs_backend.model.User;
import com.tcrs.tcrs_backend.repository.SuggestionRepository;
import com.tcrs.tcrs_backend.repository.UserRepository;
import com.tcrs.tcrs_backend.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/suggestions")
public class SuggestionController {

    @Autowired private SuggestionRepository suggestionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogService auditLogService;

    // ── Submit suggestion (any logged-in user) ────────────────────────────────
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody Map<String, String> body, Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Suggestion s = new Suggestion();
        s.setTitle(body.get("title"));
        s.setDescription(body.get("description"));
        s.setCategory(body.getOrDefault("category", "OTHER"));
        s.setSubmittedByEmail(email);
        s.setSubmittedByName(user.getName());
        s.setStatus("OPEN");

        suggestionRepository.save(s);
        auditLogService.log(email, "SUGGESTION_SUBMITTED", "SUGGESTION", s.getId(), "Suggestion: " + s.getTitle());
        return ResponseEntity.ok(s);
    }

    // ── Get my suggestions ─────────────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<?> my(Authentication auth) {
        return ResponseEntity.ok(suggestionRepository.findBySubmittedByEmail(auth.getName()));
    }

    // ── Get all suggestions (admin) ────────────────────────────────────────────
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<?> all() {
        return ResponseEntity.ok(suggestionRepository.findAllByOrderByCreatedAtDesc());
    }

    // ── Admin responds to suggestion ───────────────────────────────────────────
    @PatchMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> respond(@PathVariable String id,
                                     @RequestBody Map<String, String> body,
                                     Authentication auth) {
        Optional<Suggestion> opt = suggestionRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Suggestion s = opt.get();
        if (body.get("status") != null)        s.setStatus(body.get("status"));
        if (body.get("adminResponse") != null) s.setAdminResponse(body.get("adminResponse"));

        suggestionRepository.save(s);
        auditLogService.log(auth.getName(), "SUGGESTION_REVIEWED", "SUGGESTION", id,
            "Suggestion status: " + s.getStatus());

        return ResponseEntity.ok(s);
    }

    // ── Delete (admin) ─────────────────────────────────────────────────────────
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable String id) {
        if (!suggestionRepository.existsById(id)) return ResponseEntity.notFound().build();
        suggestionRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}
