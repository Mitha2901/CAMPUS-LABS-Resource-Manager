package com.smartlab.repository;

import com.smartlab.model.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, String> {
    List<Equipment> findByStatus(String status);
    List<Equipment> findByLabName(String labName);
}
