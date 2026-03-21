package com.ruxpress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttachmentResponse {

    private final Long id;
    private final String originalFilename;
    private final String storedUrl;
    private final String thumbnailUrl;
    private final int fileSize;
    private final String mimeType;
}
