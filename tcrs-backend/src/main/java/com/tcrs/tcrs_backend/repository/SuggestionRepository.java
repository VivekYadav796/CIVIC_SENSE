package com.tcrs.tcrs_backend.repository;


import com.tcrs.tcrs_backend.model.Suggestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SuggestionRepository extends MongoRepository<Suggestion, String> {
    List<Suggestion> findBySubmittedByEmail(String email);
    List<Suggestion> findByStatus(String status);
    List<Suggestion> findAllByOrderByCreatedAtDesc();
}