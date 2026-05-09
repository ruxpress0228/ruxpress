package com.ruxpress.integration.kafka.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PushResultPayloadDeserializationTest {

    @Test
    void mapsJsonFromPushService() throws Exception {
        String json =
                "{\"eventId\":\"550e8400-e29b-41d4-a716-446655440000\","
                        + "\"notificationId\":100,\"aggregateStatus\":\"SENT\","
                        + "\"sentAt\":\"2026-03-28T12:00:00Z\",\"failureReason\":null}";
        PushResultPayload p = new ObjectMapper().readValue(json, PushResultPayload.class);
        assertThat(p.notificationId()).isEqualTo(100L);
        assertThat(p.aggregateStatus()).isEqualTo("SENT");
        assertThat(p.sentAt()).isEqualTo("2026-03-28T12:00:00Z");
    }
}
