package com.smartlab.controller;

import com.smartlab.model.Booking;
import com.smartlab.model.Equipment;
import com.smartlab.model.MaintenanceAlert;
import com.smartlab.model.User;
import com.smartlab.service.LabService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Enable cross-origin resource sharing for college environments
public class LabController {

    @Autowired
    private LabService labService;

    // 1. Authenticate user
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        String role = credentials.get("role");

        Optional<User> userOpt = labService.login(username, password, role);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "user", Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "fullName", user.getFullName(),
                    "role", user.getRole(),
                    "department", user.getDepartment() != null ? user.getDepartment() : ""
                )
            ));
        } else {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Invalid username, password, or role selection."
            ));
        }
    }

    // 2. Systems (Equipment) API
    @GetMapping("/systems")
    public ResponseEntity<List<Equipment>> getAllSystems() {
        return ResponseEntity.ok(labService.getAllEquipment());
    }

    @PostMapping("/systems")
    public ResponseEntity<?> addSystem(@RequestBody Equipment equipment) {
        Equipment created = labService.addEquipment(equipment);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "system", created
        ));
    }

    @PutMapping("/systems/{id}")
    public ResponseEntity<?> updateSystem(@PathVariable String id, @RequestBody Equipment updated) {
        Optional<Equipment> systemOpt = labService.updateEquipment(id, updated);
        if (systemOpt.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "system", systemOpt.get()
            ));
        } else {
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "message", "System not found"
            ));
        }
    }

    @DeleteMapping("/systems/{id}")
    public ResponseEntity<?> deleteSystem(@PathVariable String id) {
        boolean deleted = labService.deleteEquipment(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "System deleted successfully."
            ));
        } else {
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "message", "System not found."
            ));
        }
    }

    // 3. Command: Mark equipment as maintained
    @PostMapping("/systems/{id}/maintain")
    public ResponseEntity<?> maintainSystem(@PathVariable String id) {
        Optional<Equipment> systemOpt = labService.maintainSystem(id);
        if (systemOpt.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "system", systemOpt.get()
            ));
        } else {
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "message", "System not found."
            ));
        }
    }

    // 4. Bookings API
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(labService.getAllBookings());
    }

    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> bookingReq) {
        try {
            String systemId = (String) bookingReq.get("systemId");
            String studentId = (String) bookingReq.get("studentId");
            LocalDate date = LocalDate.parse((String) bookingReq.get("date"));
            String timeSlot = (String) bookingReq.get("timeSlot");
            String purpose = (String) bookingReq.get("purpose");
            int durationHours = Integer.parseInt(bookingReq.get("durationHours").toString());

            Optional<Booking> bookingOpt = labService.createBooking(systemId, studentId, date, timeSlot, purpose, durationHours);
            if (bookingOpt.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "booking", bookingOpt.get()
                ));
            } else {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Failed to schedule booking. Verify Student ID and System ID."
                ));
            }
        } catch (IllegalStateException e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Internal server error: " + e.getMessage()));
        }
    }

    @PostMapping("/bookings/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id) {
        Optional<Booking> bookingOpt = labService.cancelBooking(id);
        if (bookingOpt.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "booking", bookingOpt.get()
            ));
        } else {
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "message", "Booking not found."
            ));
        }
    }

    // 5. Active alerts
    @GetMapping("/alerts")
    public ResponseEntity<List<MaintenanceAlert>> getActiveAlerts() {
        return ResponseEntity.ok(labService.getActiveAlerts());
    }
}
