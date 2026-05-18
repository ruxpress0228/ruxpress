package com.ruxpress.push.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "push.kafka")
public class PushKafkaProperties {

    private Topics topics = new Topics();

    @Getter
    @Setter
    public static class Topics {
        private String dispatch = "ruxpress.notification.push.dispatch";
        private String deviceSync = "ruxpress.user.device.sync";
        private String result = "ruxpress.notification.push.result";
        private String dispatchDlq = "ruxpress.notification.push.dispatch.dlq";
        private String deviceSyncDlq = "ruxpress.user.device.sync.dlq";
    }
}
