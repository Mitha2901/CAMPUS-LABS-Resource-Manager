package com.smartlab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Enables the background scheduling of AI predictive inspect processes
public class SmartLabApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartLabApplication.class, args);
        System.out.println("=========================================================================");
        System.out.println("  SMARTLAB AI - Intelligent Lab Resource Management Agent is ready!      ");
        System.out.println("  Backend listening for local MVC / REST clients...                     ");
        System.out.println("=========================================================================");
    }
}
