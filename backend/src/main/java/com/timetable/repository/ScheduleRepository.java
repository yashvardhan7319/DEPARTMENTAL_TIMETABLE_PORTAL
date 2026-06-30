package com.timetable.repository;

import com.timetable.entity.Schedule;
import com.timetable.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByProgram(User.Program program);
    List<Schedule> findByProgramAndDay(User.Program program, String day);
    List<Schedule> findByFacultyId(String facultyId);
    void deleteByProgram(User.Program program);
}
