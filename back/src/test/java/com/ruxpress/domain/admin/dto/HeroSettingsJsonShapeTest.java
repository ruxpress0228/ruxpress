package com.ruxpress.domain.admin.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.admin.dto.response.HeroSettingsResponse;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** The JSON shape is the frontend contract: the hero response is exactly {@code { imageUrl }}, key present even when null. */
class HeroSettingsJsonShapeTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void response_hasExactlyImageUrl() {
        JsonNode json = mapper.valueToTree(new HeroSettingsResponse("/api/v1/local-files/hero/25/10/30/hero.jpg"));

        assertThat(json.fieldNames()).toIterable().containsExactly("imageUrl");
        assertThat(json.get("imageUrl").asText()).isEqualTo("/api/v1/local-files/hero/25/10/30/hero.jpg");
    }

    @Test
    void response_keepsImageUrlKeyWhenNull() {
        JsonNode json = mapper.valueToTree(new HeroSettingsResponse(null));

        assertThat(json.fieldNames()).toIterable().containsExactly("imageUrl");
        assertThat(json.get("imageUrl").isNull()).isTrue();
    }

    /** ApiResponse drops its own null fields (NON_NULL) but must not strip the nested {@code imageUrl: null}. */
    @Test
    void apiResponseEnvelope_keepsNullImageUrlInsideData() {
        JsonNode json = mapper.valueToTree(ApiResponse.success(new HeroSettingsResponse(null)));

        assertThat(json.fieldNames()).toIterable().containsExactlyInAnyOrder("code", "message", "data");
        assertThat(json.get("data").fieldNames()).toIterable().containsExactly("imageUrl");
        assertThat(json.get("data").get("imageUrl").isNull()).isTrue();
    }
}
