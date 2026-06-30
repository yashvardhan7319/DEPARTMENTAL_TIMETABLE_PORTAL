package com.timetable.controller;

import com.timetable.dto.ScheduleDto;
import com.timetable.entity.User;
import com.timetable.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    // GET all (admin) or filtered by role
    @GetMapping
    public ResponseEntity<List<ScheduleDto>> getSchedules(
            @RequestParam(required = false) String program,
            Authentication auth) {

        boolean isAdmin = auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));

        if (isAdmin && program == null) {
            return ResponseEntity.ok(scheduleService.getAll());
        }

        if (program != null) {
            return ResponseEntity.ok(scheduleService.getByProgram(User.Program.valueOf(program.toUpperCase())));
        }

        // Faculty: return schedules by their faculty ID
        boolean isFaculty = auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_FACULTY"));
        if (isFaculty) {
            return ResponseEntity.ok(scheduleService.getByFaculty(auth.getName()));
        }

        return ResponseEntity.ok(List.of());
    }

    // Upload CSV — admin only
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ScheduleDto>> uploadCsv(@RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(scheduleService.uploadCsv(file));
    }

    // Create single entry — admin only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScheduleDto> create(@Valid @RequestBody ScheduleDto dto) {
        return ResponseEntity.ok(scheduleService.create(dto));
    }

    // Update — admin only
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScheduleDto> update(@PathVariable Long id, @Valid @RequestBody ScheduleDto dto) {
        return ResponseEntity.ok(scheduleService.update(id, dto));
    }

    // Delete — admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
