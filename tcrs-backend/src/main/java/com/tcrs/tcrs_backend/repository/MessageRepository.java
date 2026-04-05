package com.tcrs.tcrs_backend.repository;


import com.tcrs.tcrs_backend.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByComplaintIdOrderByCreatedAtAsc(String complaintId);
    long countByComplaintIdAndReadByRecipientFalseAndSenderEmailNot(String complaintId, String senderEmail);
}
