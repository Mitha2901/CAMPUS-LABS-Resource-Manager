package com.smartlab.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_alerts")
public class MaintenanceAlert {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "system_id", nullable = false)
    private Equipment equipment;

    @Column(name = "trigger_reason", nullable = false)
    private String triggerReason;

    @Column(name = "prediction_date", nullable = false)
    private LocalDate predictionDate;

    @Column(nullable = false)
    private String severity = "Medium"; // "High", "Medium"

    @Column(name = "is_resolved")
    private boolean isResolved = false;

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Default Constructor
    public MaintenanceAlert() {}

    // Parameterized Constructor
    public MaintenanceAlert(String id, Equipment equipment, String triggerReason, LocalDate predictionDate, String severity, boolean isResolved, LocalDate resolvedDate) {
        this.id = id;
        this.equipment = equipment;
        this.triggerReason = triggerReason;
        this.predictionDate = predictionDate;
        this.severity = severity;
        this.isResolved = isResolved;
        this.resolvedDate = resolvedDate;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Equipment getEquipment() { return equipment; }
    public void setEquipment(Equipment equipment) { this.equipment = equipment; }

    public String getTriggerReason() { return triggerReason; }
    public void setTriggerReason(String triggerReason) { this.triggerReason = triggerReason; }

    public LocalDate getPredictionDate() { return predictionDate; }
    public void setPredictionDate(LocalDate predictionDate) { this.predictionDate = predictionDate; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public boolean isResolved() { return isResolved; }
    public void setResolved(boolean resolved) { isResolved = resolved; }

    public LocalDate getResolvedDate() { return resolvedDate; }
    public void setResolvedDate(LocalDate resolvedDate) { this.resolvedDate = resolvedDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
