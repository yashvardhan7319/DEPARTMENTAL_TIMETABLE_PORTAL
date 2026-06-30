package com.timetable.service;

import com.opencsv.CSVReader;
import com.timetable.dto.ScheduleDto;
import com.timetable.entity.Schedule;
import com.timetable.entity.User;
import com.timetable.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepo;

    public List<ScheduleDto> getByProgram(User.Program program) {
        return scheduleRepo.findByProgram(program).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<ScheduleDto> getAll() {
        return scheduleRepo.findAll().stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<ScheduleDto> getByFaculty(String facultyId) {
        return scheduleRepo.findByFacultyId(facultyId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public List<ScheduleDto> uploadCsv(MultipartFile file) throws Exception {
        List<Schedule> parsed = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] header = reader.readNext(); // skip header row
            String[] line;
            while ((line = reader.readNext()) != null) {
                if (line.length < 7) continue;
                // CSV columns: program,day,timeSlot,subject,facultyId,facultyName,room
                Schedule s = Schedule.builder()
                        .program(User.Program.valueOf(line[0].trim().toUpperCase()))
                        .day(line[1].trim())
                        .timeSlot(line[2].trim())
                        .subject(line[3].trim())
                        .facultyId(line[4].trim())
                        .facultyName(line[5].trim())
                        .room(line[6].trim())
                        .build();
                parsed.add(s);
            }
        }

        // Clear old + bulk insert
        scheduleRepo.deleteAll();
        scheduleRepo.saveAll(parsed);
        return scheduleRepo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public ScheduleDto create(ScheduleDto dto) {
        Schedule s = toEntity(dto);
        return toDto(scheduleRepo.save(s));
    }

    @Transactional
    public ScheduleDto update(Long id, ScheduleDto dto) {
        Schedule s = scheduleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found: " + id));
        s.setProgram(dto.getProgram());
        s.setDay(dto.getDay());
        s.setTimeSlot(dto.getTimeSlot());
        s.setSubject(dto.getSubject());
        s.setFacultyId(dto.getFacultyId());
        s.setFacultyName(dto.getFacultyName());
        s.setRoom(dto.getRoom());
        return toDto(scheduleRepo.save(s));
    }

    @Transactional
    public void delete(Long id) {
        scheduleRepo.deleteById(id);
    }

    // --- mapping ---
    private ScheduleDto toDto(Schedule s) {
        ScheduleDto d = new ScheduleDto();
        d.setId(s.getId());
        d.setProgram(s.getProgram());
        d.setDay(s.getDay());
        d.setTimeSlot(s.getTimeSlot());
        d.setSubject(s.getSubject());
        d.setFacultyId(s.getFacultyId());
        d.setFacultyName(s.getFacultyName());
        d.setRoom(s.getRoom());
        return d;
    }

    private Schedule toEntity(ScheduleDto d) {
        return Schedule.builder()
                .program(d.getProgram())
                .day(d.getDay())
                .timeSlot(d.getTimeSlot())
                .subject(d.getSubject())
                .facultyId(d.getFacultyId())
                .facultyName(d.getFacultyName())
                .room(d.getRoom())
                .build();
    }
}
