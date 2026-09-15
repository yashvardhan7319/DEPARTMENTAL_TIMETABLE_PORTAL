package com.timetable.controller;

import com.timetable.entity.FacultyRequest;
import com.timetable.entity.User;
import com.timetable.repository.UserRepository;
import com.timetable.service.FacultyRequestService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class FacultyRequestController {

    private final FacultyRequestService requestService;
    private final UserRepository userRepository;

    // Faculty: get only their requests
    @GetMapping("/my")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<FacultyRequest>> getMyRequests(Authentication auth) {
        return ResponseEntity.ok(requestService.getByFaculty(auth.getName()));
    }

    // Faculty: submit new request
    @PostMapping
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<FacultyRequest> createRequest(@RequestBody FacultyRequest req, Authentication auth) {
        User u = userRepository.findByUsername(auth.getName()).orElse(null);
        String facultyName = (u != null) ? u.getFullName() : auth.getName();
        return ResponseEntity.ok(requestService.create(auth.getName(), facultyName, req));
    }

    // Admin: get all requests
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FacultyRequest>> getAllRequests() {
        return ResponseEntity.ok(requestService.getAll());
    }

    // Admin: get pending count
    @GetMapping("/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> getPendingCount() {
        return ResponseEntity.ok(requestService.getPendingCount());
    }

    // Admin: approve request
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacultyRequest> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveRequestPayload payload) {
        String resolvedDay = payload != null ? payload.getResolvedDay() : null;
        String resolvedSlot = payload != null ? payload.getResolvedSlot() : null;
        return ResponseEntity.ok(requestService.approve(id, resolvedDay, resolvedSlot));
    }

    // Admin: reject request
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacultyRequest> rejectRequest(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.reject(id));
    }

    @Data
    public static class ApproveRequestPayload {
        private String resolvedDay;
        private String resolvedSlot;
    }
}
