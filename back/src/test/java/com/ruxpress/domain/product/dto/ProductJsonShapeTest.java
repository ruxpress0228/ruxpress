package com.ruxpress.domain.product.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ruxpress.domain.product.dto.request.ProductRequest;
import com.ruxpress.domain.product.dto.response.ProductResponse;
import com.ruxpress.domain.product.entity.Product;
import com.ruxpress.domain.product.entity.ProductStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** The JSON field names are the frontend contract (types/product.ts); boolean naming is easy to get wrong with Lombok. */
class ProductJsonShapeTest {

    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    void response_usesContractFieldNames() throws Exception {
        Product p = Product.create(1L, "n", "s", "https://example.com", 1000L, "c", "d", ProductStatus.ACTIVE, true, 3);
        JsonNode json = mapper.valueToTree(ProductResponse.from(p, "/files/x.jpg"));

        assertThat(json.fieldNames()).toIterable().containsExactlyInAnyOrder(
                "id", "name", "shopName", "productUrl", "priceKrw", "category", "description",
                "imageUrl", "imageFilename", "status", "isFeatured", "sortOrder", "createdAt", "updatedAt");
        assertThat(json.get("isFeatured").asBoolean()).isTrue();
        assertThat(json.get("status").asText()).isEqualTo("ACTIVE");
        assertThat(json.get("imageUrl").asText()).isEqualTo("/files/x.jpg");
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
}
