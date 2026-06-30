package com.timetable.controller;

import com.timetable.entity.User;
import com.timetable.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    @GetMapping("/students")
    public ResponseEntity<List<User>> getStudents() {
        return ResponseEntity.ok(userService.getAllStudents());
    }

    @GetMapping("/faculty")
    public ResponseEntity<List<User>> getFaculty() {
        return ResponseEntity.ok(userService.getAllFaculty());
    }

    @PostMapping("/faculty")
    public ResponseEntity<User> createFaculty(@RequestBody CreateFacultyRequest req) {
        return ResponseEntity.ok(
            userService.createFaculty(req.getUsername(), req.getPassword(),
                    req.getFullName(), req.getProgram())
        );
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(userService.updateUser(id, req.getFullName(), req.getProgram()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class CreateFacultyRequest {
        private String username;
        private String password;
        private String fullName;
        private User.Program program;
    }

    @Data
    public static class UpdateUserRequest {
        private String fullName;
        private User.Program program;
    }
}
