package com.tcrs.tcrs_backend.controller;


import com.tcrs.tcrs_backend.service.AuditLogService;


import com.tcrs.tcrs_backend.model.AuditLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
public class AuditController {

    @Autowired private AuditLogService auditLogService;
    @Autowired private MongoTemplate mongoTemplate;

    @GetMapping
    public ResponseEntity<?> getAllLogs(
            @RequestParam(defaultValue="0")  int page,
            @RequestParam(defaultValue="15") int size,
            @RequestParam(required=false) String search,
            @RequestParam(required=false) String action) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC,"createdAt"));
        Criteria criteria = new Criteria();

        List<Criteria> conds = new java.util.ArrayList<>();
        if (search != null && !search.isBlank())
            conds.add(new Criteria().orOperator(
                Criteria.where("description").regex(search,"i"),
                Criteria.where("performedByEmail").regex(search,"i"),
                Criteria.where("action").regex(search,"i")
            ));
        if (action != null && !action.isBlank() && !action.equals("ALL"))
            conds.add(Criteria.where("action").is(action));

        if (!conds.isEmpty()) criteria = new Criteria().andOperator(conds.toArray(new Criteria[0]));

        Query q      = new Query(criteria).with(pageable);
        Query countQ = new Query(criteria);
        List<AuditLog> logs = mongoTemplate.find(q, AuditLog.class);
        long total = mongoTemplate.count(countQ, AuditLog.class);

        return ResponseEntity.ok(buildPage(logs, total, page, size));
    }

    @GetMapping("/complaint/{id}")
    public ResponseEntity<?> byComplaint(@PathVariable String id) {
        return ResponseEntity.ok(auditLogService.getLogsByComplaint(id));
    }

    @GetMapping("/user/{email}")
    public ResponseEntity<?> byUser(@PathVariable String email) {
        return ResponseEntity.ok(auditLogService.getLogsByUser(email));
    }

    private Map<String,Object> buildPage(List<?> content, long total, int page, int size) {
        int totalPages = (int)Math.ceil((double)total/size);
        Map<String,Object> r = new LinkedHashMap<>();
        r.put("content",       content);
        r.put("page",          page);
        r.put("size",          size);
        r.put("totalElements", total);
        r.put("totalPages",    totalPages);
        r.put("first",         page == 0);
        r.put("last",          page >= totalPages-1);
        r.put("hasNext",       page < totalPages-1);
        r.put("hasPrev",       page > 0);
        return r;
    }
}