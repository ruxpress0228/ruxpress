package com.ruxpress.push.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "push.fcm")
public class PushFcmProperties {

    /**
     * When false, dispatch logs payload only (no Firebase call).
     */
    private boolean enabled = false;

    /**
     * Firebase / GCP project id (앱 {@code google-services.json} 의 {@code project_id} 와 동일).
     */
    private String projectId = "";

    /**
     * Android 앱 패키지명 ({@code google-services.json} → {@code android_client_info.package_name}).
     * 설정 시 FCM AndroidConfig 에 restricted package 로 넣어 해당 패키지로만 전달되도록 제한.
     */
    private String androidPackageName = "";

    /**
     * Optional: path to service account JSON file, or leave empty and use GOOGLE_APPLICATION_CREDENTIALS.
     */
    private String credentialsPath = "";

    /**
     * Optional inline JSON for tests (not recommended for prod).
     */
    private String credentialsJson = "";
}
