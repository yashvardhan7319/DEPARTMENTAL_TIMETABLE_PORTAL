package com.timetable.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private User.Program program; // BCA or MCA

    @Column(nullable = false)
    private String day; // Monday, Tuesday, ...

    @Column(nullable = false)
    private String timeSlot; // e.g. "09:00-10:00"

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String facultyId; // e.g. BCA-FAC001

    @Column(nullable = false)
    private String facultyName;

    @Column(nullable = false)
    private String room;
}
