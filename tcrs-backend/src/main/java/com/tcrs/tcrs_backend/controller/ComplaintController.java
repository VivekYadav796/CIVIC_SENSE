package com.tcrs.tcrs_backend.controller;

import com.tcrs.tcrs_backend.model.Complaint;
import com.tcrs.tcrs_backend.model.User;
import com.tcrs.tcrs_backend.repository.ComplaintRepository;
import com.tcrs.tcrs_backend.repository.UserRepository;
import com.tcrs.tcrs_backend.service.AuditLogService;
import com.tcrs.tcrs_backend.service.EmailService;
//import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuditLogService auditLogService;
    @Autowired
    private EmailService emailService;

    // ── Submit complaint ───────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody Map<String, Object> body, Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Complaint c = new Complaint();
        c.setTitle((String) body.get("title"));
        c.setDescription((String) body.get("description"));
        c.setCategory((String) body.get("category"));
        c.setLocation((String) body.get("location"));
        c.setStatus("PENDING");
        c.setSubmittedByEmail(email);
        c.setSubmittedByName(user.getName());

        // coordinates (optional)
        if (body.get("latitude") != null)
            c.setLatitude(((Number) body.get("latitude")).doubleValue());
        if (body.get("longitude") != null)
            c.setLongitude(((Number) body.get("longitude")).doubleValue());

        complaintRepository.save(c);
        auditLogService.log(email, "COMPLAINT_CREATED", "COMPLAINT", c.getId(), "Complaint submitted: " + c.getTitle());
        return ResponseEntity.ok(c);
    }

    // ── Get my complaints ──────────────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<?> myComplaints(Authentication auth) {
        return ResponseEntity.ok(complaintRepository.findBySubmittedByEmail(auth.getName()));
    }

    // ── Get single complaint ───────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id, Authentication auth) {
        Optional<Complaint> opt = complaintRepository.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();

        Complaint c = opt.get();
        String email = auth.getName();
        String role = auth.getAuthorities().iterator().next().getAuthority();

        boolean isOwner = c.getSubmittedByEmail().equals(email);
        boolean isOfficial = role.equals("ROLE_OFFICIAL") && email.equals(c.getAssignedOfficialEmail());
        boolean isPrivileged = role.equals("ROLE_ADMIN") || role.equals("ROLE_AUDITOR");

        if (!isOwner && !isOfficial && !isPrivileged)
            return ResponseEntity.status(403).body("Access denied");

        return ResponseEntity.ok(c);
    }

    // ── Get all complaints (admin / auditor) ───────────────────────────────────
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(complaintRepository.findAll());
    }

    // ── Get complaints assigned to me (official) ───────────────────────────────
    @GetMapping("/assigned")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<?> assignedToMe(Authentication auth) {
        return ResponseEntity.ok(complaintRepository.findByAssignedOfficialEmail(auth.getName()));
    }

    // ── Nearby complaints (map feature) ───────────────────────────────────────
    // Returns complaints within ~5km of given coordinates
    @GetMapping("/nearby")
    public ResponseEntity<?> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "0.05") double radius) {
        List<Complaint> nearby = complaintRepository.findByLatitudeBetweenAndLongitudeBetween(
                lat - radius, lat + radius,
                lng - radius, lng + radius);
        return ResponseEntity.ok(nearby);
    }

    // ── All complaints with coordinates (for full map view) ───────────────────
    @GetMapping("/map")
    public ResponseEntity<?> mapComplaints() {
        return ResponseEntity.ok(complaintRepository.findByLatitudeNotNullAndLongitudeNotNull());
    }

    // ── Update status (admin) ──────────────────────────────────────────────────
    @PatchMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Optional<Complaint> opt = complaintRepository.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();

        Complaint c = opt.get();
        String oldStatus = c.getStatus();
        c.setStatus(body.get("status"));
        if (body.get("adminRemarks") != null)
            c.setAdminRemarks(body.get("adminRemarks"));

        complaintRepository.save(c);
        auditLogService.log(auth.getName(), "STATUS_UPDATED", "COMPLAINT", id,
                "Status: " + oldStatus + " → " + body.get("status"));

        return ResponseEntity.ok(c);
    }

    // ── Assign official (admin) ────────────────────────────────────────────────
    @PatchMapping("/admin/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignOfficial(@PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Optional<Complaint> opt = complaintRepository.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();

        String officialName = body.get("officialName");
        Optional<User> officialOpt = userRepository.findByNameIgnoreCaseAndRole(officialName, "OFFICIAL");
        if (officialOpt.isEmpty())
            return ResponseEntity.status(404).body("No official found with name: " + officialName);

        User official = officialOpt.get();
        Complaint c = opt.get();
        c.setAssignedOfficialEmail(official.getEmail());
        c.setAssignedOfficialName(official.getName());
        c.setStatus("IN_PROGRESS");
        complaintRepository.save(c);

        auditLogService.log(auth.getName(), "OFFICIAL_ASSIGNED", "COMPLAINT", id,
                "Assigned to " + official.getName());

        // notify citizen by email
        try {
            emailService.sendComplaintAssignedEmail(c.getSubmittedByEmail(), official.getName(), c.getTitle());
        } catch (Exception ignored) {
        }

        return ResponseEntity.ok(c);
    }

    // ── Get available officials (admin) ────────────────────────────────────────
    @GetMapping("/admin/officials")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getOfficials() {
        List<User> officials = userRepository.findByRole("OFFICIAL");
        return ResponseEntity.ok(
                officials.stream()
                        .map(o -> {
                            Map<String, Object> map = new HashMap<>();
                            map.put("id", o.getId());
                            map.put("name", o.getName());
                            map.put("email", o.getEmail());
                            // map.put("department", o.getDepartment() != null ? o.getDepartment() : "");
                            return map;
                        })
                        .toList());
    }

    // ── Submit appeal (citizen) ────────────────────────────────────────────────
    @PostMapping("/{id}/appeal")
    public ResponseEntity<?> submitAppeal(@PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Optional<Complaint> opt = complaintRepository.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();

        Complaint c = opt.get();

        if (!c.getSubmittedByEmail().equals(auth.getName()))
            return ResponseEntity.status(403).body("You can only appeal your own complaints");

        if (c.isAppealSubmitted())
            return ResponseEntity.status(400).body("Appeal already submitted for this complaint");

        if (!c.getStatus().equals("RESOLVED") && !c.getStatus().equals("REJECTED"))
            return ResponseEntity.status(400).body("You can only appeal resolved or rejected complaints");

        c.setAppealSubmitted(true);
        c.setAppealReason(body.get("reason"));
        c.setAppealStatus("PENDING_REVIEW");
        c.setAppealSubmittedAt(LocalDateTime.now());
        complaintRepository.save(c);

        auditLogService.log(auth.getName(), "APPEAL_SUBMITTED", "COMPLAINT", id,
                "Appeal submitted: " + body.get("reason"));

        return ResponseEntity.ok(c);
    }

    // ── Review appeal (admin) ──────────────────────────────────────────────────
    @PatchMapping("/admin/{id}/appeal")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reviewAppeal(@PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Optional<Complaint> opt = complaintRepository.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();

        Complaint c = opt.get();
        c.setAppealStatus(body.get("appealStatus")); // ACCEPTED or REJECTED

        if ("ACCEPTED".equals(body.get("appealStatus"))) {
            c.setStatus("IN_PROGRESS");
        }

        complaintRepository.save(c);
        auditLogService.log(auth.getName(), "APPEAL_REVIEWED", "COMPLAINT", id,
                "Appeal " + body.get("appealStatus"));

        return ResponseEntity.ok(c);
    }

    // ── Delete complaint (admin) ───────────────────────────────────────────────
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
        if (!complaintRepository.existsById(id))
            return ResponseEntity.notFound().build();
        complaintRepository.deleteById(id);
        auditLogService.log(auth.getName(), "COMPLAINT_DELETED", "COMPLAINT", id, "Complaint deleted");
        return ResponseEntity.ok("Deleted");
    }

    // ── Dashboard stats (admin) ────────────────────────────────────────────────
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(Map.of(
                "total", complaintRepository.count(),
                "pending", complaintRepository.countByStatus("PENDING"),
                "inProgress", complaintRepository.countByStatus("IN_PROGRESS"),
                "resolved", complaintRepository.countByStatus("RESOLVED"),
                "rejected", complaintRepository.countByStatus("REJECTED")));
    }
}