package com.timetable.dto;

import com.timetable.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScheduleDto {
    private Long id;

    @NotNull
    private User.Program program;

    @NotBlank
    private String day;

    @NotBlank
    private String timeSlot;

    @NotBlank
    private String subject;

    @NotBlank
    private String facultyId;

    @NotBlank
    private String facultyName;

    @NotBlank
    private String room;
}
