package com.tcrs.tcrs_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/checking")
    public String health(){
        return "Positive sir...";
    }
}
