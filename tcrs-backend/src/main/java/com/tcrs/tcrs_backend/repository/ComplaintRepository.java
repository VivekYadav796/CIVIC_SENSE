package com.tcrs.tcrs_backend.repository;


import com.tcrs.tcrs_backend.model.Complaint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintRepository extends MongoRepository<Complaint, String> {
    List<Complaint> findBySubmittedByEmail(String email);
    List<Complaint> findByStatus(String status);
    List<Complaint> findByCategory(String category);
    List<Complaint> findByAssignedOfficialEmail(String email);
    long countByStatus(String status);

    // find complaints with coordinates in a bounding box (for map nearby feature)
    @Query("{ 'latitude': { $gte: ?0, $lte: ?1 }, 'longitude': { $gte: ?2, $lte: ?3 } }")
    List<Complaint> findByLatitudeBetweenAndLongitudeBetween(
        double minLat, double maxLat, double minLng, double maxLng
    );

    // find complaints that have coordinates set
    List<Complaint> findByLatitudeNotNullAndLongitudeNotNull();
}