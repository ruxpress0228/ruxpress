package com.ruxpress.push.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
@ConditionalOnProperty(prefix = "push.fcm", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class FirebaseConfig {

    private final PushFcmProperties fcmProperties;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps() != null && !FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }
        InputStream in = openCredentials();
        if (in == null) {
            throw new IllegalStateException(
                    "push.fcm.enabled=true but no credentials: set GOOGLE_APPLICATION_CREDENTIALS or push.fcm.credentials-path / push.fcm.credentials-json");
        }
        try (in) {
            FirebaseOptions.Builder options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(in));
            if (StringUtils.hasText(fcmProperties.getProjectId())) {
                options.setProjectId(fcmProperties.getProjectId().trim());
            }
            FirebaseApp app = FirebaseApp.initializeApp(options.build());
            log.info(
                    "FirebaseApp initialized projectId={}",
                    StringUtils.hasText(fcmProperties.getProjectId())
                            ? fcmProperties.getProjectId()
                            : "(from credentials)");
            return app;
        }
    }

    private InputStream openCredentials() throws IOException {
        if (StringUtils.hasText(fcmProperties.getCredentialsJson())) {
            return new ByteArrayInputStream(
                    fcmProperties.getCredentialsJson().getBytes(StandardCharsets.UTF_8));
        }
        if (StringUtils.hasText(fcmProperties.getCredentialsPath())) {
            return new FileInputStream(fcmProperties.getCredentialsPath());
        }
        String env = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        if (StringUtils.hasText(env)) {
            return new FileInputStream(env);
        }
        return null;
    }
}
