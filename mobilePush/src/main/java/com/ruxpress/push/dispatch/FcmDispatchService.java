package com.ruxpress.push.dispatch;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.ruxpress.push.config.PushFcmProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmDispatchService {

    private final PushFcmProperties fcmProperties;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<FirebaseApp> firebaseAppProvider;

    /**
     * @return provider message id, or null when skipped / no Firebase app
     */
    public String sendToToken(String deviceToken, String title, String body, Object dataJson) {
        if (!fcmProperties.isEnabled()) {
            log.info("[FCM disabled] would send title={} tokenPrefix={}", title, prefix(deviceToken));
            return null;
        }
        FirebaseApp app = firebaseAppProvider.getIfAvailable();
        if (app == null) {
            log.warn("push.fcm.enabled but FirebaseApp bean missing; skip send tokenPrefix={}", prefix(deviceToken));
            return null;
        }
        try {
            Message.Builder builder = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .setAndroidConfig(buildAndroidConfig());
            Map<String, String> data = toDataMap(dataJson);
            if (!data.isEmpty()) {
                builder.putAllData(data);
            }
            String id = FirebaseMessaging.getInstance(app).send(builder.build());
            log.info("FCM sent ok messageId={} title={} tokenPrefix={}", id, title, prefix(deviceToken));
            return id;
        } catch (FirebaseMessagingException e) {
            log.warn("FCM send failed: {} tokenPrefix={}", e.getMessage(), prefix(deviceToken));
            throw new FcmSendException(e.getMessagingErrorCode() != null ? e.getMessagingErrorCode().name() : "UNKNOWN", e);
        } catch (Exception e) {
            // 잘못된 토큰·SDK 내부 오류 등 FCM API 전 예외 — 핸들러에서 ERROR 시도로 기록되게 통일
            log.warn("FCM send unexpected: {} tokenPrefix={}", e.getMessage(), prefix(deviceToken), e);
            throw new FcmSendException("UNEXPECTED", e);
        }
    }

    private AndroidConfig buildAndroidConfig() {
        AndroidConfig.Builder android = AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH);
        if (StringUtils.hasText(fcmProperties.getAndroidPackageName())) {
            android.setRestrictedPackageName(fcmProperties.getAndroidPackageName().trim());
        }
        return android.build();
    }

    private Map<String, String> toDataMap(Object dataJson) {
        if (dataJson == null) {
            return Map.of();
        }
        if (dataJson instanceof Map<?, ?> m) {
            Map<String, String> out = new HashMap<>();
            m.forEach((k, v) -> {
                if (k != null && v != null) {
                    out.put(String.valueOf(k), String.valueOf(v));
                }
            });
            return out;
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> asMap = objectMapper.convertValue(dataJson, Map.class);
            if (asMap == null) {
                return Map.of();
            }
            Map<String, String> out = new HashMap<>();
            asMap.forEach((k, v) -> {
                if (v != null) {
                    try {
                        out.put(k, v instanceof String s ? s : objectMapper.writeValueAsString(v));
                    } catch (JsonProcessingException e) {
                        out.put(k, String.valueOf(v));
                    }
                }
            });
            return out;
        } catch (IllegalArgumentException e) {
            try {
                return Map.of("payload", objectMapper.writeValueAsString(dataJson));
            } catch (JsonProcessingException ex) {
                return Map.of();
            }
        }
    }

    private static String prefix(String token) {
        if (token == null || token.length() <= 8) {
            return "***";
        }
        return token.substring(0, 8) + "...";
    }

    public static class FcmSendException extends RuntimeException {
        private final String errorCode;

        public FcmSendException(String errorCode, Throwable cause) {
            super(cause);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
