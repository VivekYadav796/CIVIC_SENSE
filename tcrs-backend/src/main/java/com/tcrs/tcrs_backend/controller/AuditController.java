package com.tcrs.tcrs_backend.controller;


import com.tcrs.tcrs_backend.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
public class AuditController {

    @Autowired
    private AuditLogService auditLogService;

    // Get all audit logs
    @GetMapping
    public ResponseEntity<?> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    // Get logs for a specific complaint
    @GetMapping("/complaint/{id}")
    public ResponseEntity<?> getByComplaint(@PathVariable String id) {
        return ResponseEntity.ok(auditLogService.getLogsByComplaint(id));
    }

    // Get logs by a specific user
    @GetMapping("/user/{email}")
    public ResponseEntity<?> getByUser(@PathVariable String email) {
        return ResponseEntity.ok(auditLogService.getLogsByUser(email));
    }
}
