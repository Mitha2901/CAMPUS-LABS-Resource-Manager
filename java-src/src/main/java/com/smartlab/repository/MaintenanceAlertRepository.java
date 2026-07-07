package com.smartlab.repository;

import com.smartlab.model.MaintenanceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaintenanceAlertRepository extends JpaRepository<MaintenanceAlert, String> {
    List<MaintenanceAlert> findByIsResolved(boolean isResolved);
    List<MaintenanceAlert> findByEquipmentIdAndIsResolved(String equipmentId, boolean isResolved);
}
