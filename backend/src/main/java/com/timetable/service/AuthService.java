package com.timetable.service;

import com.timetable.dto.AuthDtos.*;
import com.timetable.entity.User;
import com.timetable.repository.UserRepository;
import com.timetable.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
        );
        UserDetails details = userDetailsService.loadUserByUsername(req.getUsername());
        String token = jwtUtils.generateToken(details);

        User user = userRepository.findByUsername(req.getUsername()).orElseThrow();
        return new AuthResponse(token, user.getUsername(), user.getFullName(),
                user.getRole().name(), user.getProgram() != null ? user.getProgram().name() : null);
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        User user = User.builder()
                .username(req.getUsername())
                .password(encoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(User.Role.STUDENT)
                .program(req.getProgram())
                .build();
        userRepository.save(user);

        UserDetails details = userDetailsService.loadUserByUsername(req.getUsername());
        String token = jwtUtils.generateToken(details);
        return new AuthResponse(token, user.getUsername(), user.getFullName(),
                user.getRole().name(), user.getProgram() != null ? user.getProgram().name() : null);
    }
}
