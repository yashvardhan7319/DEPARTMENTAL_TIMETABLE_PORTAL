package com.timetable.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String facultyId;

    @Column(nullable = false)
    private String facultyName;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String currentDay;

    @Column(nullable = false)
    private String currentSlot;

    @Column(nullable = false)
    private String requestedDay;

    @Column(nullable = false)
    private String requestedSlot;

    @Column(length = 1000)
    private String reason;

    @Column(nullable = false)
    @Builder.Default
    private String status = "pending"; // pending, approved, rejected

    private String resolvedDay;

    private String resolvedSlot;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
