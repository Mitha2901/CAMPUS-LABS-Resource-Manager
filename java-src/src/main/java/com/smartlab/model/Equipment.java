package com.smartlab.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment")
public class Equipment {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "lab_name", nullable = false)
    private String labName;

    @Column(name = "total_usage_hours")
    private int totalUsageHours = 0;

    @Column(name = "last_maintenance_date", nullable = false)
    private LocalDate lastMaintenanceDate;

    @Column(nullable = false)
    private String status = "Available"; // "Available", "In Use", "Maintenance Required"

    @Column(name = "usage_threshold")
    private int usageThreshold = 50; // Threshold after which AI Agent flags for maintenance

    @Column(name = "maintenance_limit_days")
    private int maintenanceLimitDays = 30; // Limit after which AI Agent flags for maintenance

    @Column(columnDefinition = "TEXT")
    private String specification;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Default Constructor
    public Equipment() {}

    // Parameterized Constructor
    public Equipment(String id, String name, String labName, int totalUsageHours, LocalDate lastMaintenanceDate, String status, int usageThreshold, int maintenanceLimitDays, String specification) {
        this.id = id;
        this.name = name;
        this.labName = labName;
        this.totalUsageHours = totalUsageHours;
        this.lastMaintenanceDate = lastMaintenanceDate;
        this.status = status;
        this.usageThreshold = usageThreshold;
        this.maintenanceLimitDays = maintenanceLimitDays;
        this.specification = specification;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLabName() { return labName; }
    public void setLabName(String labName) { this.labName = labName; }

    public int getTotalUsageHours() { return totalUsageHours; }
    public void setTotalUsageHours(int totalUsageHours) { this.totalUsageHours = totalUsageHours; }

    public LocalDate getLastMaintenanceDate() { return lastMaintenanceDate; }
    public void setLastMaintenanceDate(LocalDate lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getUsageThreshold() { return usageThreshold; }
    public void setUsageThreshold(int usageThreshold) { this.usageThreshold = usageThreshold; }

    public int getMaintenanceLimitDays() { return maintenanceLimitDays; }
    public void setMaintenanceLimitDays(int maintenanceLimitDays) { this.maintenanceLimitDays = maintenanceLimitDays; }

    public String getSpecification() { return specification; }
    public void setSpecification(String specification) { this.specification = specification; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
