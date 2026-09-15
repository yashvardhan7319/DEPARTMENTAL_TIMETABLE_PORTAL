package com.timetable.controller;

import com.timetable.entity.Notice;
import com.timetable.entity.User;
import com.timetable.repository.NoticeRepository;
import com.timetable.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    // View notices: accessible to Admin, Faculty, Student
    @GetMapping
    public ResponseEntity<List<Notice>> getAllNotices() {
        return ResponseEntity.ok(noticeRepository.findAllByOrderByPostedAtDesc());
    }

    // Post notice: Admin only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Notice> createNotice(@RequestBody CreateNoticeRequest req, Authentication auth) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new IllegalArgumentException("Notice title is required");
        }
        if (req.getContent() == null || req.getContent().isBlank()) {
            throw new IllegalArgumentException("Notice content is required");
        }

        User u = userRepository.findByUsername(auth.getName()).orElse(null);
        String postedBy = (u != null) ? u.getFullName() : auth.getName();

        Notice notice = Notice.builder()
                .title(req.getTitle().trim())
                .content(req.getContent().trim())
                .postedBy(postedBy)
                .postedAt(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(noticeRepository.save(notice));
    }

    // Delete notice: Admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class CreateNoticeRequest {
        private String title;
        private String content;
    }
}
