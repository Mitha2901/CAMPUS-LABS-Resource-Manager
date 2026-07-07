package com.smartlab.service;

import com.smartlab.model.Equipment;
import com.smartlab.model.MaintenanceAlert;
import com.smartlab.repository.EquipmentRepository;
import com.smartlab.repository.MaintenanceAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * SMARTLAB AI - Intelligent Rule-Based AI Agent Decision Service.
 *
 * This class implements the core predictive AI agent responsibilities:
 * 1. Track cumulative usage hours of lab systems.
 * 2. Analyze maintenance elapsed duration (days).
 * 3. Automatically predict failure risks and update equipment statuses.
 * 4. Create active notifications/maintenance alerts.
 */
@Service
public class AIAgentService {

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private MaintenanceAlertRepository alertRepository;

    /**
     * Executes the Intelligent Rule-Based AI Decision Logic:
     * 
     * RULE:
     * IF total_usage_hours > USAGE_THRESHOLD
     * OR days_since_last_maintenance > MAINTENANCE_LIMIT
     * THEN
     *    status = "Maintenance Required" (and generate high-priority prediction alerts)
     * ELSE
     *    status = "Available" or "In Use"
     */
    public void evaluateSystemRules(Equipment system) {
        LocalDate today = LocalDate.now();
        long daysSinceMaintenance = ChronoUnit.DAYS.between(system.getLastMaintenanceDate(), today);

        boolean usageExceeded = system.getTotalUsageHours() > system.getUsageThreshold();
        boolean durationExceeded = daysSinceMaintenance > system.getMaintenanceLimitDays();

        if (usageExceeded || durationExceeded) {
            // Predict maintenance requirement
            if (!"Maintenance Required".equals(system.getStatus())) {
                system.setStatus("Maintenance Required");
                equipmentRepository.save(system);

                // Check if there is an unresolved alert already
                boolean alertExists = alertRepository.findByEquipmentIdAndIsResolved(system.getId(), false)
                        .stream().anyMatch(a -> !a.isResolved());

                if (!alertExists) {
                    String reason = usageExceeded 
                        ? String.format("AI Agent Warning: Usage hours (%d hrs) crossed the threshold of %d hrs.", 
                            system.getTotalUsageHours(), system.getUsageThreshold())
                        : String.format("AI Agent Warning: %d days elapsed since last maintenance (safety limit: %d days).", 
                            daysSinceMaintenance, system.getMaintenanceLimitDays());

                    MaintenanceAlert alert = new MaintenanceAlert();
                    alert.setId("ALRT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
                    alert.setEquipment(system);
                    alert.setTriggerReason(reason);
                    alert.setPredictionDate(today);
                    alert.setSeverity(usageExceeded ? "High" : "Medium");
                    alert.setResolved(false);

                    alertRepository.save(alert);
                }
            }
        } else {
            // If the status was previously "Maintenance Required" but is now safe (e.g. after parameter update)
            if ("Maintenance Required".equals(system.getStatus())) {
                system.setStatus("Available");
                equipmentRepository.save(system);
            }
        }
    }

    /**
     * Iterates over all lab equipment and triggers the predictive rule evaluation.
     */
    public void runAIInspection() {
        equipmentRepository.findAll().forEach(this::evaluateSystemRules);
    }
}
