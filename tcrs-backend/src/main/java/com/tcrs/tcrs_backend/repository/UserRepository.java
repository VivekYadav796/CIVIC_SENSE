package com.tcrs.tcrs_backend.repository;


import com.tcrs.tcrs_backend.model.User;
// ── UserRepository.java ──────────────────────────────────────────────────────

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(String role);
    Optional<User> findByNameIgnoreCaseAndRole(String name, String role);
}