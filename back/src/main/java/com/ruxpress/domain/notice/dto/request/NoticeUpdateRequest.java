package com.ruxpress.domain.notice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NoticeUpdateRequest {

    @NotBlank(message = "제목을 입력해주세요")
    @Size(max = 300)
    private String title;

    @NotBlank(message = "내용을 입력해주세요")
    private String content;

    private boolean isPinned;
}
