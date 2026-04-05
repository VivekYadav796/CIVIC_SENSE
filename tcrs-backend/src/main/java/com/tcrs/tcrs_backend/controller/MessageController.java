package com.tcrs.tcrs_backend.controller;


import com.tcrs.tcrs_backend.model.Complaint;
import com.tcrs.tcrs_backend.model.Message;
import com.tcrs.tcrs_backend.model.User;
import com.tcrs.tcrs_backend.repository.ComplaintRepository;
import com.tcrs.tcrs_backend.repository.MessageRepository;
import com.tcrs.tcrs_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired private MessageRepository messageRepository;
    @Autowired private ComplaintRepository complaintRepository;
    @Autowired private UserRepository userRepository;

    // ── Send a message ────────────────────────────────────────────────────────
    @PostMapping("/{complaintId}")
    public ResponseEntity<?> send(@PathVariable String complaintId,
                                  @RequestBody Map<String, String> body,
                                  Authentication auth) {
        Optional<Complaint> cOpt = complaintRepository.findById(complaintId);
        if (cOpt.isEmpty()) return ResponseEntity.notFound().build();

        Complaint complaint = cOpt.get();
        String email = auth.getName();
        String role  = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");

        // only citizen who owns it or assigned official can message
        boolean isCitizen  = complaint.getSubmittedByEmail().equals(email);
        boolean isOfficial = email.equals(complaint.getAssignedOfficialEmail());
        boolean isAdmin    = role.equals("ADMIN");

        if (!isCitizen && !isOfficial && !isAdmin)
            return ResponseEntity.status(403).body("Not authorized to message on this complaint");

        User sender = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Message message = new Message();
        message.setComplaintId(complaintId);
        message.setSenderEmail(email);
        message.setSenderName(sender.getName());
        message.setSenderRole(role);
        message.setContent(body.get("content"));
        message.setReadByRecipient(false);

        messageRepository.save(message);
        return ResponseEntity.ok(message);
    }

    // ── Get all messages for a complaint ──────────────────────────────────────
    @GetMapping("/{complaintId}")
    public ResponseEntity<?> getMessages(@PathVariable String complaintId, Authentication auth) {
        Optional<Complaint> cOpt = complaintRepository.findById(complaintId);
        if (cOpt.isEmpty()) return ResponseEntity.notFound().build();

        Complaint complaint = cOpt.get();
        String email = auth.getName();
        String role  = auth.getAuthorities().iterator().next().getAuthority();

        boolean isCitizen  = complaint.getSubmittedByEmail().equals(email);
        boolean isOfficial = email.equals(complaint.getAssignedOfficialEmail());
        boolean isPrivileged = role.equals("ROLE_ADMIN") || role.equals("ROLE_AUDITOR");

        if (!isCitizen && !isOfficial && !isPrivileged)
            return ResponseEntity.status(403).body("Not authorized");

        return ResponseEntity.ok(messageRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId));
    }

    // ── Mark messages as read ─────────────────────────────────────────────────
    @PatchMapping("/{complaintId}/read")
    public ResponseEntity<?> markRead(@PathVariable String complaintId, Authentication auth) {
        var messages = messageRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
        String email = auth.getName();
        messages.stream()
            .filter(m -> !m.getSenderEmail().equals(email) && !m.isReadByRecipient())
            .forEach(m -> { m.setReadByRecipient(true); messageRepository.save(m); });
        return ResponseEntity.ok("Marked as read");
    }
}
