package com.timetable.dto;

import com.timetable.entity.User;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    @Data
    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank private String fullName;
        @NotBlank private String username; // registration number
        @NotBlank private String password;
        private User.Program program; // BCA or MCA
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String username;
        private String fullName;
        private String role;
        private String program;

        public AuthResponse(String token, String username, String fullName, String role, String program) {
            this.token = token;
            this.username = username;
            this.fullName = fullName;
            this.role = role;
            this.program = program;
        }
    }
}
