package com.timetable.repository;

import com.timetable.entity.FacultyRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FacultyRequestRepository extends JpaRepository<FacultyRequest, Long> {
    List<FacultyRequest> findByFacultyIdOrderByCreatedAtDesc(String facultyId);
    List<FacultyRequest> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
