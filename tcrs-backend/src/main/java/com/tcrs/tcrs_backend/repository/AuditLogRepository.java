package com.tcrs.tcrs_backend.repository;


import com.tcrs.tcrs_backend.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByCreatedAtDesc();
    List<AuditLog> findByEntityId(String entityId);
    List<AuditLog> findByPerformedByEmail(String email);
}
