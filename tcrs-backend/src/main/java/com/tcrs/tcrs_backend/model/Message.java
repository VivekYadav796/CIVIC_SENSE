package com.tcrs.tcrs_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "messages")
public class Message {

    @Id
    private String id;

    // which complaint this message belongs to
    private String complaintId;

    private String senderEmail;
    private String senderName;
    private String senderRole;

    private String content;

    private boolean readByRecipient;

    @CreatedDate
    private LocalDateTime createdAt;
}