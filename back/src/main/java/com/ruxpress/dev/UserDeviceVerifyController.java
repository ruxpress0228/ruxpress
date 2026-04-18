package com.ruxpress.dev;

import com.ruxpress.domain.user.entity.UserDevice;
import com.ruxpress.domain.user.repository.UserDeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 로컬 E2E 구간 검증용. {@code ruxpress.dev-verify-api-enabled=true} 일 때만 노출.
 */
@RestController
@RequestMapping("/internal/dev")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "ruxpress", name = "dev-verify-api-enabled", havingValue = "true")
public class UserDeviceVerifyController {

    private final UserDeviceRepository userDeviceRepository;

    @GetMapping("/user-device")
    public ResponseEntity<Map<String, Object>> userDevice(
            @RequestParam("userId") long userId,
            @RequestParam("deviceToken") String deviceToken) {
        return userDeviceRepository
                .findByUserIdAndDeviceToken(userId, deviceToken)
                .map(this::toBody)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toBody(UserDevice d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", d.getUserId());
        m.put("deviceToken", d.getDeviceToken());
        m.put("deviceType", d.getDeviceType().name());
        m.put("active", d.isActive());
        return m;
    }
}
