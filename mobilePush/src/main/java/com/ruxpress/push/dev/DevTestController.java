package com.ruxpress.push.dev;

import com.ruxpress.push.device.PushDeviceSyncService;
import com.ruxpress.push.dispatch.PushDispatchHandler;
import com.ruxpress.push.domain.PushDevice;
import com.ruxpress.push.domain.PushDeviceRepository;
import com.ruxpress.push.kafka.dto.PushDispatchEvent;
import com.ruxpress.push.kafka.dto.UserDeviceSyncEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/internal/dev")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "push", name = "dev-api-enabled", havingValue = "true")
public class DevTestController {

    private final PushDispatchHandler pushDispatchHandler;
    private final PushDeviceSyncService pushDeviceSyncService;
    private final PushDeviceRepository pushDeviceRepository;

    @PostMapping("/dispatch")
    public ResponseEntity<Map<String, String>> dispatch(@RequestBody PushDispatchEvent event) {
        pushDispatchHandler.handle(event);
        return ResponseEntity.ok(Map.of("status", "dispatched"));
    }

    @PostMapping("/device-sync")
    public ResponseEntity<Map<String, String>> deviceSync(@RequestBody UserDeviceSyncEvent event) {
        pushDeviceSyncService.apply(event);
        return ResponseEntity.ok(Map.of("status", "synced"));
    }

    /** 구간 검증: Kafka 소비 후 push_devices 반영 여부 확인 */
    @GetMapping("/push-device")
    public ResponseEntity<Map<String, Object>> pushDevice(@RequestParam("deviceToken") String deviceToken) {
        return pushDeviceRepository
                .findByDeviceToken(deviceToken)
                .map(this::pushDeviceBody)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> pushDeviceBody(PushDevice d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", d.getUserId());
        m.put("deviceToken", d.getDeviceToken());
        m.put("deviceType", d.getDeviceType());
        m.put("active", d.isActive());
        return m;
    }
}
