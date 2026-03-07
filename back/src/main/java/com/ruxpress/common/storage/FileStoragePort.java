package com.ruxpress.common.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 저장소 포트 (DIP).
 * local/dev: 로컬 디스크, prod: S3 등 구현체 교체 시 서비스 코드 무변경.
 */
public interface FileStoragePort {

    /**
     * 파일을 저장하고 접근 가능한 저장 경로(storedUrl)를 반환한다.
     * @param directory 저장 디렉터리 (예: inquiry/1)
     * @param file 업로드 파일
     * @return 저장 후 URL 또는 상대 경로 (DB stored_url에 저장)
     */
    String store(String directory, MultipartFile file);

    /**
     * storedUrl에 해당하는 파일을 Resource로 로드한다 (다운로드용).
     */
    Resource loadAsResource(String storedUrl);

    /**
     * storedUrl에 해당하는 파일을 삭제한다.
     */
    void delete(String storedUrl);
}
