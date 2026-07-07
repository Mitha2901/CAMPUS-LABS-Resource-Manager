package com.smartlab.repository;

import com.smartlab.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByStudentId(String studentId);
    List<Booking> findByEquipmentIdAndBookingDate(String equipmentId, LocalDate date);
    List<Booking> findByStatus(String status);
}
