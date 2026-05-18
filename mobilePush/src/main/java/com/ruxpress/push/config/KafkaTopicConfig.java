package com.ruxpress.push.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Kafka Admin {@link NewTopic} beans. Active when {@code no-docker} is off (e.g. {@code local}),
 * or when {@code local-kafka} is on together with {@code no-docker} for host Kafka without Docker.
 */
@Configuration
@Profile({"!no-docker", "local-kafka"})
public class KafkaTopicConfig {

    @Bean
    public NewTopic dispatchTopic(PushKafkaProperties p) {
        return TopicBuilder.name(p.getTopics().getDispatch()).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic deviceSyncTopic(PushKafkaProperties p) {
        return TopicBuilder.name(p.getTopics().getDeviceSync()).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic resultTopic(PushKafkaProperties p) {
        return TopicBuilder.name(p.getTopics().getResult()).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic dispatchDlqTopic(PushKafkaProperties p) {
        return TopicBuilder.name(p.getTopics().getDispatchDlq()).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic deviceSyncDlqTopic(PushKafkaProperties p) {
        return TopicBuilder.name(p.getTopics().getDeviceSyncDlq()).partitions(1).replicas(1).build();
    }
}
