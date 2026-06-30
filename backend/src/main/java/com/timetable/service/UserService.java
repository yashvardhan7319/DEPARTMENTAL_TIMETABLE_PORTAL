package com.timetable.service;

import com.timetable.entity.User;
import com.timetable.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

    public List<User> getAllStudents() {
        return userRepository.findByRole(User.Role.STUDENT);
    }

    public List<User> getAllFaculty() {
        return userRepository.findByRole(User.Role.FACULTY);
    }

    @Transactional
    public User createFaculty(String username, String password, String fullName, User.Program program) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Faculty ID already exists");
        }
        return userRepository.save(User.builder()
                .username(username)
                .password(encoder.encode(password))
                .fullName(fullName)
                .role(User.Role.FACULTY)
                .program(program)
                .build());
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public User updateUser(Long id, String fullName, User.Program program) {
        User u = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        u.setFullName(fullName);
        u.setProgram(program);
        return userRepository.save(u);
    }
}
