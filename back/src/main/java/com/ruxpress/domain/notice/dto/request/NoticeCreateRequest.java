package com.ruxpress.domain.notice.dto.request;

import com.ruxpress.domain.notice.entity.NoticeStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NoticeCreateRequest {

    @NotBlank(message = "제목을 입력해주세요")
    @Size(max = 300)
    private String title;

    @NotBlank(message = "내용을 입력해주세요")
    private String content;

    private boolean isPinned;

    private NoticeStatus status;

    private LocalDateTime publishedAt;
}
