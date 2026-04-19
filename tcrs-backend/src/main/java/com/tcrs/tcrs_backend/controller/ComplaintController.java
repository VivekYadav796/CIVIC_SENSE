package com.tcrs.tcrs_backend.controller;

import com.tcrs.tcrs_backend.model.Complaint;
import com.tcrs.tcrs_backend.model.User;
import com.tcrs.tcrs_backend.repository.ComplaintRepository;
import com.tcrs.tcrs_backend.repository.UserRepository;
import com.tcrs.tcrs_backend.service.AuditLogService;
import com.tcrs.tcrs_backend.service.EmailService;
//import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired private ComplaintRepository complaintRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogService auditLogService;
    @Autowired private EmailService emailService;
    @Autowired private MongoTemplate mongoTemplate;

    @PostMapping
    @CacheEvict(value = {"complaints","stats","nearbyComplaints"}, allEntries = true)
    public ResponseEntity<?> submit(@RequestBody Map<String, Object> body, Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new NoSuchElementException("User not found"));

        validateRequired(body, "title","description","category","location");

        Complaint c = new Complaint();
        c.setTitle(((String)body.get("title")).trim());
        c.setDescription(((String)body.get("description")).trim());
        c.setCategory((String)body.get("category"));
        c.setLocation(((String)body.get("location")).trim());
        c.setStatus("PENDING");
        c.setSubmittedByEmail(email);
        c.setSubmittedByName(user.getName());
        if (body.get("latitude")  != null) c.setLatitude(((Number)body.get("latitude")).doubleValue());
        if (body.get("longitude") != null) c.setLongitude(((Number)body.get("longitude")).doubleValue());

        complaintRepository.save(c);
        auditLogService.log(email, "COMPLAINT_CREATED", "COMPLAINT", c.getId(), "Submitted: "+c.getTitle());
        return ResponseEntity.ok(c);
    }

    @GetMapping("/my")
    public ResponseEntity<?> myComplaints(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="10") int size,
            @RequestParam(required=false) String status,
            Authentication auth) {

        Criteria criteria = Criteria.where("submittedByEmail").is(auth.getName());
        if (status != null && !status.isBlank() && !status.equals("ALL"))
            criteria = criteria.and("status").is(status);
        return ResponseEntity.ok(pageQuery(criteria, page, size));
    }
    
    // get single complaint
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id, Authentication auth) {
        Complaint c = complaintRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Complaint not found"));

        String email = auth.getName();
        String role  = auth.getAuthorities().iterator().next().getAuthority();
        boolean ok   = c.getSubmittedByEmail().equals(email)
            || (role.equals("ROLE_OFFICIAL") && email.equals(c.getAssignedOfficialEmail()))
            || role.equals("ROLE_ADMIN") || role.equals("ROLE_AUDITOR");

        if (!ok) return ResponseEntity.status(403).body(Map.of("message","Access denied"));
        return ResponseEntity.ok(c);
    }

    // ── Get all complaints (admin / auditor) ───────────────────────────────────
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="10") int size,
            @RequestParam(required=false) String status,
            @RequestParam(required=false) String category,
            @RequestParam(required=false) String search) {

        List<Criteria> conds = new ArrayList<>();
        if (status   != null && !status.isBlank()   && !status.equals("ALL"))   conds.add(Criteria.where("status").is(status));
        if (category != null && !category.isBlank() && !category.equals("ALL")) conds.add(Criteria.where("category").is(category));
        if (search   != null && !search.isBlank())
            conds.add(new Criteria().orOperator(
                Criteria.where("title").regex(search,"i"),
                Criteria.where("location").regex(search,"i"),
                Criteria.where("submittedByName").regex(search,"i")
            ));

        Criteria criteria = conds.isEmpty() ? new Criteria() : new Criteria().andOperator(conds.toArray(new Criteria[0]));
        return ResponseEntity.ok(pageQuery(criteria, page, size));
    }

    // complaint assigned to me (official)
    @GetMapping("/assigned")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<?> assignedToMe(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="10") int size,
            @RequestParam(required=false) String status,
            Authentication auth) {

        Criteria criteria = Criteria.where("assignedOfficialEmail").is(auth.getName());
        if (status != null && !status.isBlank() && !status.equals("ALL"))
            criteria = criteria.and("status").is(status);
        return ResponseEntity.ok(pageQuery(criteria, page, size));
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
    @Cacheable(value="complaints", key="'map-all'")
    public List<Complaint> mapComplaints() {
        return complaintRepository.findByLatitudeNotNullAndLongitudeNotNull();
    }

    // update status admin
    @PatchMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Caching(evict={@CacheEvict(value="complaints",allEntries=true),@CacheEvict(value="stats",allEntries=true)})
    public ResponseEntity<?> updateStatus(@PathVariable String id,
                                          @RequestBody Map<String,String> body, Authentication auth) {
        Complaint c = complaintRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Complaint not found"));
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) throw new IllegalArgumentException("Status is required");
        String old = c.getStatus();
        c.setStatus(newStatus);
        if (body.get("adminRemarks") != null) c.setAdminRemarks(body.get("adminRemarks"));
        complaintRepository.save(c);
        auditLogService.log(auth.getName(),"STATUS_UPDATED","COMPLAINT",id,"Status: "+old+" → "+newStatus);
        return ResponseEntity.ok(c);
    }

    // assign official by admin
    @PatchMapping("/admin/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Caching(evict={@CacheEvict(value="complaints",allEntries=true),@CacheEvict(value="stats",allEntries=true)})
    public ResponseEntity<?> assignOfficial(@PathVariable String id,
                                             @RequestBody Map<String,String> body, Authentication auth) {
        Complaint c = complaintRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Complaint not found"));
        String name = body.get("officialName");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Official name is required");
        User off = userRepository.findByNameIgnoreCaseAndRole(name,"OFFICIAL")
            .orElseThrow(() -> new NoSuchElementException("No official found: "+name));
        c.setAssignedOfficialEmail(off.getEmail());
        c.setAssignedOfficialName(off.getName());
        c.setStatus("IN_PROGRESS");
        complaintRepository.save(c);
        auditLogService.log(auth.getName(),"OFFICIAL_ASSIGNED","COMPLAINT",id,"Assigned to "+off.getName());
        try { emailService.sendComplaintAssignedEmail(c.getSubmittedByEmail(), off.getName(), c.getTitle()); } catch (Exception ignored) {}
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
    @CacheEvict(value="complaints", allEntries=true)
    public ResponseEntity<?> submitAppeal(@PathVariable String id,
                                          @RequestBody Map<String,String> body, Authentication auth) {
        Complaint c = complaintRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Complaint not found"));
        if (!c.getSubmittedByEmail().equals(auth.getName()))
            return ResponseEntity.status(403).body(Map.of("message","You can only appeal your own complaints"));
        if (c.isAppealSubmitted()) throw new IllegalArgumentException("Appeal already submitted");
        if (!c.getStatus().equals("RESOLVED") && !c.getStatus().equals("REJECTED"))
            throw new IllegalArgumentException("You can only appeal resolved or rejected complaints");
        String reason = body.get("reason");
        if (reason == null || reason.trim().length() < 10)
            throw new IllegalArgumentException("Provide a reason of at least 10 characters");
        c.setAppealSubmitted(true);
        c.setAppealReason(reason.trim());
        c.setAppealStatus("PENDING_REVIEW");
        c.setAppealSubmittedAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        complaintRepository.save(c);
        auditLogService.log(auth.getName(),"APPEAL_SUBMITTED","COMPLAINT",id,"Appeal: "+reason);
        return ResponseEntity.ok(c);
    }

    // ── Review appeal (admin) ──────────────────────────────────────────────────
    @PatchMapping("/admin/{id}/appeal")
    @PreAuthorize("hasRole('ADMIN')")
    @CacheEvict(value="complaints", allEntries=true)
    public ResponseEntity<?> reviewAppeal(@PathVariable String id,
                                           @RequestBody Map<String,String> body, Authentication auth) {
        Complaint c = complaintRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Complaint not found"));
        String appealStatus = body.get("appealStatus");
        if (appealStatus == null) throw new IllegalArgumentException("appealStatus required");
        c.setAppealStatus(appealStatus);
        if ("ACCEPTED".equals(appealStatus)) c.setStatus("IN_PROGRESS");
        complaintRepository.save(c);
        auditLogService.log(auth.getName(),"APPEAL_REVIEWED","COMPLAINT",id,"Appeal: "+appealStatus);
        return ResponseEntity.ok(c);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Caching(evict={@CacheEvict(value="complaints",allEntries=true),@CacheEvict(value="stats",allEntries=true)})
    public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
        if (!complaintRepository.existsById(id)) throw new NoSuchElementException("Complaint not found");
        complaintRepository.deleteById(id);
        auditLogService.log(auth.getName(),"COMPLAINT_DELETED","COMPLAINT",id,"Deleted");
        return ResponseEntity.ok(Map.of("message","Deleted successfully"));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Cacheable(value="stats", key="'dashboard'")
    public Map<String, Long> stats() {
        Map<String, Long> stats = new java.util.HashMap<>();
        stats.put("total",      complaintRepository.count());
        stats.put("pending",    complaintRepository.countByStatus("PENDING"));
        stats.put("inProgress", complaintRepository.countByStatus("IN_PROGRESS"));
        stats.put("resolved",   complaintRepository.countByStatus("RESOLVED"));
        stats.put("rejected",   complaintRepository.countByStatus("REJECTED"));
        return stats;
    }

    private Map<String,Object> pageQuery(Criteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC,"createdAt"));
        Query q      = new Query(criteria).with(pageable);
        Query countQ = new Query(criteria);
        List<Complaint> content = mongoTemplate.find(q, Complaint.class);
        long total   = mongoTemplate.count(countQ, Complaint.class);
        int totalPages = (int)Math.ceil((double)total/size);
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("content",       content);
        result.put("page",          page);
        result.put("size",          size);
        result.put("totalElements", total);
        result.put("totalPages",    totalPages);
        result.put("first",         page == 0);
        result.put("last",          page >= totalPages-1);
        result.put("hasNext",       page < totalPages-1);
        result.put("hasPrev",       page > 0);
        return result;
    }

    private void validateRequired(Map<String,Object> body, String... fields) {
        for (String f : fields) {
            Object v = body.get(f);
            if (v == null || v.toString().isBlank())
                throw new IllegalArgumentException(f+" is required");
        }
    }
}