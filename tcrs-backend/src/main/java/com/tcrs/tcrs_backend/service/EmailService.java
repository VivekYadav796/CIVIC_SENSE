package com.tcrs.tcrs_backend.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name}")
    private String appName;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(appName + " — Password Reset OTP");
        message.setText(
            "Hello,\n\n" +
            "You requested a password reset for your " + appName + " account.\n\n" +
            "Your OTP code is: " + otp + "\n\n" +
            "This code expires in 10 minutes.\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "— " + appName + " Team"
        );
        mailSender.send(message);
    }

    public void sendComplaintAssignedEmail(String toEmail, String officialName, String complaintTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(appName + " — Your complaint has been assigned");
        message.setText(
            "Hello,\n\n" +
            "Your complaint \"" + complaintTitle + "\" has been assigned to " + officialName + ".\n\n" +
            "You can now send messages to the assigned official through the platform.\n\n" +
            "— " + appName + " Team"
        );
        mailSender.send(message);
    }
}
