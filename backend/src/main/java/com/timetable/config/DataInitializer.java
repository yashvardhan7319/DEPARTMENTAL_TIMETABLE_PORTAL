package com.timetable.config;

import com.opencsv.CSVReader;
import com.timetable.entity.Schedule;
import com.timetable.entity.User;
import com.timetable.repository.ScheduleRepository;
import com.timetable.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository     userRepository;
    private final ScheduleRepository scheduleRepository;
    private final PasswordEncoder    encoder;

    // ── 12-hr time slot constants ─────────────────────────────────────────
    private static final String S1 = "9:00-10:00 AM";
    private static final String S2 = "10:00-11:00 AM";
    private static final String S3 = "11:00 AM-12:00 PM";
    private static final String S4 = "12:00-1:00 PM";
    // ---------- 1:00-2:00 PM  LUNCH BREAK (no entries) ----------
    private static final String S5 = "2:00-3:00 PM";
    private static final String S6 = "3:00-4:00 PM";
    private static final String S7 = "4:00-5:00 PM";

    private static final User.Program BCA = User.Program.BCA;

    @Override
    public void run(String... args) throws Exception {

        // ── USERS ─────────────────────────────────────────────────────────
        seedUser("admin",      "admin123", "System Administrator",  User.Role.ADMIN,   null);
        seedUser("CA-FAC001",  "12345",    "Mrs. Kapila Sharma",    User.Role.FACULTY, BCA);
        seedUser("CA-FAC002",  "12345",    "Mr. Simanta Kalita",    User.Role.FACULTY, BCA);
        seedUser("CA-FAC003",  "12345",    "Dr. Sumon Dey",         User.Role.FACULTY, BCA);
        seedUser("CA-FAC004",  "12345",    "Mr. Dipendra Gurung",   User.Role.FACULTY, BCA);
        seedUser("CA-FAC005",  "12345",    "Mrs. KS / Mr. BP",      User.Role.FACULTY, BCA);
        seedUser("202300001",  "123",      "Demo Student",          User.Role.STUDENT, BCA);
        seedUser("202300002",  "123",      "Demo MCA Student",      User.Role.STUDENT, User.Program.MCA);

        // ── BCA VI SEM — Even Semester 2026 ──────────────────────────────
        // Dept. of Computer Applications, SMIT  |  Room A208
        // Slots: 9 AM–5 PM (1-hr each), Lunch 1–2 PM
        if (scheduleRepository.count() == 0) {
            List<Schedule> seedSchedules = loadSeedSchedules();
            if (seedSchedules.isEmpty()) {
                seedSchedules = List.of(

                // ── MONDAY ────────────────────────────────────────────────
                //  S1  Big Data & Its Applications   Mrs.KS/Mr.BP       A208
                e(BCA, "Monday",    S1, "Big Data & Its Applications",  "CA-FAC005", "Mrs. KS / Mr. BP",   "A208"),
                //  S2  Machine Learning              Mr.Dipendra Gurung A208
                e(BCA, "Monday",    S2, "Machine Learning",             "CA-FAC004", "Mr. Dipendra Gurung","A208"),
                //  S3  Data Analytics using Python   Dr.Sumon Dey       A208
                e(BCA, "Monday",    S3, "Data Analytics using Python",  "CA-FAC003", "Dr. Sumon Dey",      "A208"),
                //  S4  Cloud Computing and Security  Mr.Simanta Kalita  A208
                e(BCA, "Monday",    S4, "Cloud Computing and Security", "CA-FAC002", "Mr. Simanta Kalita", "A208"),
                // ----- LUNCH 1-2 PM -----
                //  S6  Software Engineering          Mrs.Kapila Sharma  A208
                e(BCA, "Monday",    S6, "Software Engineering",         "CA-FAC001", "Mrs. Kapila Sharma", "A208"),
                //  S7  Python Programming            Mr.Simanta Kalita  A208
                e(BCA, "Monday",    S7, "Python Programming",           "CA-FAC002", "Mr. Simanta Kalita", "A208"),

                // ── TUESDAY ───────────────────────────────────────────────
                e(BCA, "Tuesday",   S2, "Machine Learning",             "CA-FAC004", "Mr. Dipendra Gurung","A208"),
                e(BCA, "Tuesday",   S3, "Software Engineering",         "CA-FAC001", "Mrs. Kapila Sharma", "A208"),
                e(BCA, "Tuesday",   S4, "Python Programming",           "CA-FAC002", "Mr. Simanta Kalita", "A208"),
                // ----- LUNCH 1-2 PM -----
                e(BCA, "Tuesday",   S5, "Big Data & Its Applications",  "CA-FAC005", "Mrs. KS / Mr. BP",   "A208"),
                e(BCA, "Tuesday",   S6, "Cloud Computing and Security", "CA-FAC002", "Mr. Simanta Kalita", "A208"),
                e(BCA, "Tuesday",   S7, "Data Analytics using Python",  "CA-FAC003", "Dr. Sumon Dey",      "A208"),

                // ── WEDNESDAY ─────────────────────────────────────────────
                e(BCA, "Wednesday", S1, "Python Programming",           "CA-FAC002", "Mr. Simanta Kalita", "A208"),
                e(BCA, "Wednesday", S2, "Data Analytics using Python",  "CA-FAC003", "Dr. Sumon Dey",      "A208"),
                e(BCA, "Wednesday", S3, "Cloud Computing and Security", "CA-FAC002", "Mr. Simanta Kalita", "A208"),
                // S4 — two parallel groups
                e(BCA, "Wednesday", S4, "Machine Learning",             "CA-FAC004", "Mr. Dipendra Gurung","A208"),
                e(BCA, "Wednesday", S4, "Big Data & Its Applications",  "CA-FAC005", "Mrs. KS / Mr. BP",   "A207"),
                // ----- LUNCH 1-2 PM -----
                e(BCA, "Wednesday", S6, "Software Engineering",         "CA-FAC001", "Mrs. Kapila Sharma", "A208"),

                // ── THURSDAY ──────────────────────────────────────────────
                // S1 — two parallel groups
                e(BCA, "Thursday",  S1, "Data Analytics using Python",  "CA-FAC003", "Dr. Sumon Dey",      "A208"),
                e(BCA, "Thursday",  S1, "Cloud Computing and Security", "CA-FAC002", "Mr. Simanta Kalita", "A207"),
                // S2 — two parallel groups
                e(BCA, "Thursday",  S2, "Machine Learning",             "CA-FAC004", "Mr. Dipendra Gurung","A208"),
                e(BCA, "Thursday",  S2, "Big Data & Its Applications",  "CA-FAC005", "Mrs. KS / Mr. BP",   "A207"),
                e(BCA, "Thursday",  S3, "Python Programming",           "CA-FAC002", "Mr. Simanta Kalita", "A208"),
                e(BCA, "Thursday",  S4, "Software Engineering",         "CA-FAC001", "Mrs. Kapila Sharma", "A208"),
                // ----- LUNCH 1-2 PM -----
                // Python Lab — each group gets 1 hr slot (Gr-I = 2-3 PM, Gr-II = 3-4 PM)
                e(BCA, "Thursday",  S5, "Python Lab (Gr-I)",            "CA-FAC002", "Mr. Simanta Kalita", "Lab-201"),
                e(BCA, "Thursday",  S6, "Python Lab (Gr-II)",           "CA-FAC002", "Mr. Simanta Kalita", "Lab-202"),

                // ── FRIDAY ────────────────────────────────────────────────
                // SE Lab Gr-I  → 9-10 AM and 10-11 AM  (1 hr each)
                e(BCA, "Friday",    S1, "SE Lab (Gr-I)",                "CA-FAC001", "Mrs. Kapila Sharma", "Lab-201"),
                e(BCA, "Friday",    S2, "SE Lab (Gr-I)",                "CA-FAC001", "Mrs. Kapila Sharma", "Lab-201"),
                // SE Lab Gr-II → 11-12 PM and 12-1 PM
                e(BCA, "Friday",    S3, "SE Lab (Gr-II)",               "CA-FAC001", "Mrs. Kapila Sharma", "Lab-201"),
                e(BCA, "Friday",    S4, "SE Lab (Gr-II)",               "CA-FAC001", "Mrs. Kapila Sharma", "Lab-201")

                // SATURDAY: no classes
                );
            }

            scheduleRepository.saveAll(seedSchedules);
            seedFacultyUsers(seedSchedules);
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private List<Schedule> loadSeedSchedules() throws Exception {
        ClassPathResource seed = new ClassPathResource("seed/schedule_seed.csv");
        if (!seed.exists()) {
            return List.of();
        }

        List<Schedule> schedules = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(seed.getInputStream(), StandardCharsets.UTF_8))) {
            reader.readNext(); // header: program,day,timeSlot,subject,facultyId,facultyName,room
            String[] line;
            while ((line = reader.readNext()) != null) {
                if (line.length < 7) continue;
                schedules.add(Schedule.builder()
                        .program(User.Program.valueOf(line[0].trim().toUpperCase()))
                        .day(line[1].trim())
                        .timeSlot(line[2].trim())
                        .subject(line[3].trim())
                        .facultyId(line[4].trim())
                        .facultyName(line[5].trim())
                        .room(line[6].trim())
                        .build());
            }
        }
        return schedules;
    }

    private void seedFacultyUsers(List<Schedule> schedules) {
        Map<String, Schedule> facultyById = new LinkedHashMap<>();
        for (Schedule schedule : schedules) {
            String facultyId = schedule.getFacultyId();
            if (facultyId == null || facultyId.isBlank() || "FAC-TBA".equals(facultyId)) {
                continue;
            }
            facultyById.putIfAbsent(facultyId, schedule);
        }

        for (Schedule schedule : facultyById.values()) {
            seedUser(schedule.getFacultyId(), "12345", schedule.getFacultyName(),
                    User.Role.FACULTY, schedule.getProgram());
        }
    }

    private Schedule e(User.Program prog, String day, String slot,
                       String subject, String facId, String facName, String room) {
        return Schedule.builder()
                .program(prog).day(day).timeSlot(slot)
                .subject(subject).facultyId(facId).facultyName(facName).room(room)
                .build();
    }

    private void seedUser(String username, String pass, String fullName,
                          User.Role role, User.Program program) {
        if (!userRepository.existsByUsername(username)) {
            userRepository.save(User.builder()
                    .username(username).password(encoder.encode(pass))
                    .fullName(fullName).role(role).program(program).build());
        }
    }
}
