package com.timetable.service;

import com.timetable.entity.FacultyRequest;
import com.timetable.entity.Schedule;
import com.timetable.repository.FacultyRequestRepository;
import com.timetable.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacultyRequestService {

    private final FacultyRequestRepository requestRepo;
    private final ScheduleRepository scheduleRepo;

    public List<FacultyRequest> getAll() {
        return requestRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<FacultyRequest> getByFaculty(String facultyId) {
        return requestRepo.findByFacultyIdOrderByCreatedAtDesc(facultyId);
    }

    public long getPendingCount() {
        return requestRepo.countByStatus("pending");
    }

    @Transactional
    public FacultyRequest create(String facultyId, String facultyName, FacultyRequest req) {
        req.setFacultyId(facultyId);
        req.setFacultyName(facultyName);
        req.setStatus("pending");
        req.setCreatedAt(LocalDateTime.now());
        return requestRepo.save(req);
    }

    @Transactional
    public FacultyRequest approve(Long id, String resolvedDay, String resolvedSlot) {
        FacultyRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found: " + id));

        String finalDay = (resolvedDay != null && !resolvedDay.isBlank()) ? resolvedDay : req.getRequestedDay();
        String finalSlot = (resolvedSlot != null && !resolvedSlot.isBlank()) ? resolvedSlot : req.getRequestedSlot();

        List<Schedule> schedules = scheduleRepo.findByFacultyId(req.getFacultyId());
        Schedule match = schedules.stream()
                .filter(s -> s.getSubject().equalsIgnoreCase(req.getSubject().trim())
                        && s.getDay().equalsIgnoreCase(req.getCurrentDay().trim())
                        && s.getTimeSlot().equalsIgnoreCase(req.getCurrentSlot().trim()))
                .findFirst()
                .orElse(null);

        if (match != null) {
            match.setDay(finalDay);
            match.setTimeSlot(finalSlot);
            scheduleRepo.save(match);
        }

        req.setStatus("approved");
        req.setResolvedDay(finalDay);
        req.setResolvedSlot(finalSlot);
        return requestRepo.save(req);
    }

    @Transactional
    public FacultyRequest reject(Long id) {
        FacultyRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found: " + id));
        req.setStatus("rejected");
        return requestRepo.save(req);
    }
}
