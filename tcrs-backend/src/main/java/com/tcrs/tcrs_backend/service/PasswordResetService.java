package com.tcrs.tcrs_backend.service;


import com.tcrs.tcrs_backend.model.PasswordResetOtp;
import com.tcrs.tcrs_backend.model.User;
import com.tcrs.tcrs_backend.repository.PasswordResetOtpRepository;
import com.tcrs.tcrs_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;

@Service
public class PasswordResetService {

    @Autowired private PasswordResetOtpRepository otpRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EmailService emailService;
    @Autowired private PasswordEncoder passwordEncoder;

    @Value("${otp.expiry.minutes:10}")
    private int otpExpiryMinutes;

    public String sendOtp(String email) {
        // check user exists
        if (!userRepository.existsByEmail(email)) {
            return "NOT_FOUND";
        }

        // delete any existing OTP for this email
        otpRepository.deleteByEmail(email);

        // generate 6-digit OTP
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));

        // save to DB
        PasswordResetOtp record = new PasswordResetOtp(email, otp, otpExpiryMinutes);
        otpRepository.save(record);

        // send email
        emailService.sendOtpEmail(email, otp);

        return "SENT";
    }

    public String verifyOtp(String email, String otp) {
        Optional<PasswordResetOtp> optOtp = otpRepository.findTopByEmailOrderByCreatedAtDesc(email);

        if (optOtp.isEmpty()) return "NOT_FOUND";

        PasswordResetOtp record = optOtp.get();

        if (record.isUsed())    return "ALREADY_USED";
        if (record.isExpired()) return "EXPIRED";
        if (!record.getOtp().equals(otp)) return "INVALID";

        return "VALID";
    }

    public String resetPassword(String email, String otp, String newPassword) {
        String verification = verifyOtp(email, otp);
        if (!verification.equals("VALID")) return verification;

        // update password
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return "NOT_FOUND";

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // mark OTP as used
        PasswordResetOtp record = otpRepository.findTopByEmailOrderByCreatedAtDesc(email).get();
        record.setUsed(true);
        otpRepository.save(record);

        return "SUCCESS";
    }
}