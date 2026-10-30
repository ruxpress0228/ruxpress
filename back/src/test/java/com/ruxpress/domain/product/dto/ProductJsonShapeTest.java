package com.ruxpress.domain.product.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ruxpress.domain.product.dto.request.ProductRequest;
import com.ruxpress.domain.product.dto.response.ProductResponse;
import com.ruxpress.domain.product.dto.response.WishToggleResponse;
import com.ruxpress.domain.product.dto.response.WishlistItemResponse;
import com.ruxpress.domain.product.entity.Product;
import com.ruxpress.domain.product.entity.ProductStatus;
import com.ruxpress.domain.product.entity.ProductWishlist;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/** The JSON field names are the frontend contract (types/product.ts); boolean naming is easy to get wrong with Lombok. */
class ProductJsonShapeTest {

    /** Same date handling as Spring Boot's default mapper (ISO strings, not timestamp arrays). */
    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Test
    void response_usesContractFieldNames() throws Exception {
        Product p = Product.create(1L, "n", "s", "https://example.com", 1000L, "c", "d", ProductStatus.ACTIVE, true, 3);
        JsonNode json = mapper.valueToTree(ProductResponse.from(p, "/files/x.jpg"));

        assertThat(json.fieldNames()).toIterable().containsExactlyInAnyOrder(
                "id", "name", "shopName", "productUrl", "priceKrw", "category", "description",
                "imageUrl", "imageFilename", "status", "isFeatured", "sortOrder", "viewCount", "createdAt", "updatedAt");
        assertThat(json.get("isFeatured").asBoolean()).isTrue();
        assertThat(json.get("status").asText()).isEqualTo("ACTIVE");
        assertThat(json.get("imageUrl").asText()).isEqualTo("/files/x.jpg");
        assertThat(json.get("viewCount").isIntegralNumber()).isTrue();
        assertThat(json.get("viewCount").asLong()).isZero();
    }

    @Test
    void request_readsContractFieldNames() throws Exception {
        ProductRequest req = mapper.readValue("""
                {"name":"n","shopName":"s","productUrl":"https://example.com","priceKrw":129000,
                 "category":"c","description":null,"status":"HIDDEN","isFeatured":true,"sortOrder":2}
                """, ProductRequest.class);

        assertThat(req.getName()).isEqualTo("n");
        assertThat(req.getPriceKrw()).isEqualTo(129000L);
        assertThat(req.getStatus()).isEqualTo(ProductStatus.HIDDEN);
        assertThat(req.getIsFeatured()).isTrue();
        assertThat(req.getSortOrder()).isEqualTo(2);
    }

    // ─── wishlist (catalogue v2) ──────────────────────────

    @Test
    void wishlistItem_usesContractFieldNames() {
        Product p = Product.create(1L, "n", "s", "https://example.com", 1000L, "c", "d", ProductStatus.ACTIVE, false, 0);
        ReflectionTestUtils.setField(p, "id", 3L);
        ProductWishlist wish = ProductWishlist.of(7L, 3L);
        ReflectionTestUtils.setField(wish, "id", 5L);
        ReflectionTestUtils.setField(wish, "createdAt", LocalDateTime.of(2026, 10, 30, 4, 0));

        JsonNode json = mapper.valueToTree(WishlistItemResponse.of(wish, ProductResponse.from(p, null)));

        assertThat(json.fieldNames()).toIterable().containsExactlyInAnyOrder("id", "product", "createdAt");
        assertThat(json.get("id").asLong()).isEqualTo(5L);
        assertThat(json.get("createdAt").asText()).isEqualTo("2026-10-30T04:00:00");
        JsonNode product = json.get("product");
        assertThat(product.isObject()).isTrue();
        assertThat(product.get("id").asLong()).isEqualTo(3L);
        assertThat(product.fieldNames()).toIterable().contains("isFeatured", "sortOrder", "viewCount", "imageUrl");
        assertThat(product.get("imageUrl").isNull()).isTrue();
    }

    @Test
    void wishToggle_serialisesWishedWithoutIsPrefix() {
        JsonNode json = mapper.valueToTree(new WishToggleResponse(3L, true, 4L));

        assertThat(json.fieldNames()).toIterable().containsExactlyInAnyOrder("productId", "wished", "count");
        assertThat(json.get("productId").asLong()).isEqualTo(3L);
        assertThat(json.get("wished").asBoolean()).isTrue();
        assertThat(json.get("count").asLong()).isEqualTo(4L);

        JsonNode removed = mapper.valueToTree(new WishToggleResponse(3L, false, 0L));
        assertThat(removed.get("wished").asBoolean()).isFalse();
        assertThat(removed.get("count").asLong()).isZero();
    }
}
