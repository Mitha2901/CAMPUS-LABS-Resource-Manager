package com.smartlab.service;

import com.smartlab.model.Booking;
import com.smartlab.model.Equipment;
import com.smartlab.model.MaintenanceAlert;
import com.smartlab.model.User;
import com.smartlab.repository.BookingRepository;
import com.smartlab.repository.EquipmentRepository;
import com.smartlab.repository.MaintenanceAlertRepository;
import com.smartlab.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LabService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MaintenanceAlertRepository alertRepository;

    @Autowired
    private AIAgentService aiAgentService;

    // User Methods
    public Optional<User> login(String username, String password, String role) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getPasswordHash().equals(password) && u.getRole().equalsIgnoreCase(role));
    }

    // Equipment Methods
    public List<Equipment> getAllEquipment() {
        // Run AI inspection to guarantee up-to-date statuses
        aiAgentService.runAIInspection();
        return equipmentRepository.findAll();
    }

    public Equipment addEquipment(Equipment equipment) {
        if (equipment.getId() == null || equipment.getId().isEmpty()) {
            equipment.setId("SYS-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }
        Equipment saved = equipmentRepository.save(equipment);
        aiAgentService.evaluateSystemRules(saved);
        return saved;
    }

    public Optional<Equipment> updateEquipment(String id, Equipment updated) {
        return equipmentRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setLabName(updated.getLabName());
            existing.setTotalUsageHours(updated.getTotalUsageHours());
            existing.setLastMaintenanceDate(updated.getLastMaintenanceDate());
            existing.setUsageThreshold(updated.getUsageThreshold());
            existing.setMaintenanceLimitDays(updated.getMaintenanceLimitDays());
            existing.setSpecification(updated.getSpecification());
            
            Equipment saved = equipmentRepository.save(existing);
            aiAgentService.evaluateSystemRules(saved);
            return saved;
        });
    }

    public boolean deleteEquipment(String id) {
        if (equipmentRepository.existsById(id)) {
            equipmentRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Booking Methods
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByStudent(String studentId) {
        return bookingRepository.findByStudentId(studentId);
    }

    public Optional<Booking> createBooking(String systemId, String studentId, LocalDate date, String timeSlot, String purpose, int durationHours) {
        Optional<Equipment> systemOpt = equipmentRepository.findById(systemId);
        Optional<User> studentOpt = userRepository.findById(studentId);

        if (systemOpt.isEmpty() || studentOpt.isEmpty()) {
            return Optional.empty();
        }

        Equipment system = systemOpt.get();
        
        // Block booking if system is down for maintenance
        if ("Maintenance Required".equals(system.getStatus())) {
            throw new IllegalStateException("Booking Denied: System requires AI-predicted safety maintenance.");
        }

        // Check scheduling conflicts
        boolean conflict = bookingRepository.findByEquipmentIdAndBookingDate(systemId, date).stream()
                .anyMatch(b -> b.getTimeSlot().equalsIgnoreCase(timeSlot) && "Active".equals(b.getStatus()));

        if (conflict) {
            throw new IllegalArgumentException("Booking Conflict: This system is already occupied during this slot.");
        }

        Booking booking = new Booking();
        booking.setId("BKNG-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        booking.setEquipment(system);
        booking.setStudent(studentOpt.get());
        booking.setBookingDate(date);
        booking.setTimeSlot(timeSlot);
        booking.setPurpose(purpose);
        booking.setDurationHours(durationHours);
        booking.setStatus("Active");

        // Increase equipment cumulative hours
        system.setTotalUsageHours(system.getTotalUsageHours() + durationHours);
        if ("Available".equals(system.getStatus())) {
            system.setStatus("In Use");
        }
        equipmentRepository.save(system);

        Booking savedBooking = bookingRepository.save(booking);
        
        // Re-evaluate predictive rules
        aiAgentService.evaluateSystemRules(system);

        return Optional.of(savedBooking);
    }

    public Optional<Booking> cancelBooking(String bookingId) {
        return bookingRepository.findById(bookingId).map(booking -> {
            booking.setStatus("Cancelled");
            
            Equipment system = booking.getEquipment();
            system.setTotalUsageHours(Math.max(0, system.getTotalUsageHours() - booking.getDurationHours()));
            if ("In Use".equals(system.getStatus())) {
                system.setStatus("Available");
            }
            equipmentRepository.save(system);
            
            aiAgentService.evaluateSystemRules(system);
            return bookingRepository.save(booking);
        });
    }

    // Mark as Maintained (Admin action)
    public Optional<Equipment> maintainSystem(String id) {
        return equipmentRepository.findById(id).map(system -> {
            system.setTotalUsageHours(0);
            system.setLastMaintenanceDate(LocalDate.now());
            system.setStatus("Available");
            equipmentRepository.save(system);

            // Resolve any alerts
            alertRepository.findByEquipmentIdAndIsResolved(id, false).forEach(alert -> {
                alert.setResolved(true);
                alert.setResolvedDate(LocalDate.now());
                alertRepository.save(alert);
            });

            return system;
        });
    }

    // Alerts
    public List<MaintenanceAlert> getActiveAlerts() {
        return alertRepository.findByIsResolved(false);
    }
}
