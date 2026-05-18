package com.ruxpress.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ruxpress.kafka")
public class RuxpressKafkaProperties {

    private boolean publishEvents = false;

    private boolean consumeResults = false;

    private Topics topics = new Topics();

    @Getter
    @Setter
    public static class Topics {
        private String dispatch = "ruxpress.notification.push.dispatch";
        private String deviceSync = "ruxpress.user.device.sync";
        private String result = "ruxpress.notification.push.result";
    }
}
