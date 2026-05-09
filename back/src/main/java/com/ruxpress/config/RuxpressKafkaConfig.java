package com.ruxpress.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;

@Configuration
@EnableKafka
@EnableConfigurationProperties(RuxpressKafkaProperties.class)
public class RuxpressKafkaConfig {
}
