package com.tcrs.tcrs_backend.service;


import com.tcrs.tcrs_backend.model.AuditLog;
import com.tcrs.tcrs_backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void log(String performedByEmail, String action,
                    String entityType, String entityId, String description) {
        AuditLog log = new AuditLog();
        log.setPerformedByEmail(performedByEmail);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDescription(description);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AuditLog> getLogsByComplaint(String complaintId) {
        return auditLogRepository.findByEntityId(complaintId);
    }

    public List<AuditLog> getLogsByUser(String email) {
        return auditLogRepository.findByPerformedByEmail(email);
    }
}
