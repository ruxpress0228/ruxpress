package com.ruxpress.domain.exchange.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/**
 * Russian Central Bank (CBR) daily exchange rate XML feed client.
 * <p>
 * Feed: https://www.cbr.ru/scripts/XML_daily.asp (no API key required).
 * For KRW, CBR gives e.g. Nominal=1000, Value=54,0531 meaning 1000 KRW = 54.0531 RUB.
 * We return rate as KRW per 1 RUB = Nominal/Value.
 * </p>
 */
@Component
@Slf4j
public class CbrApiClient {

    private static final String CBR_DAILY_URL = "https://www.cbr.ru/scripts/XML_daily.asp";
    private static final String TARGET_CURRENCY = "KRW";
    private static final int RATE_SCALE = 6;

    private final RestTemplate restTemplate;

    public CbrApiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Fetches current KRW rate from CBR. Returns KRW per 1 RUB (e.g. 18.5 means 1 RUB = 18.5 KRW).
     */
    public Optional<BigDecimal> fetchKrwPerRub() {
        try {
            String xml = restTemplate.getForObject(CBR_DAILY_URL, String.class);
            if (xml == null || xml.isBlank()) {
                log.warn("CBR API returned empty response");
                return Optional.empty();
            }
            return parseKrwRate(xml);
        } catch (Exception e) {
            log.error("Failed to fetch CBR exchange rate", e);
            return Optional.empty();
        }
    }

    private Optional<BigDecimal> parseKrwRate(String xml) {
        try {
            var factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            var builder = factory.newDocumentBuilder();
            var doc = builder.parse(new org.xml.sax.InputSource(new java.io.StringReader(xml)));
            doc.getDocumentElement().normalize();

            var valutes = doc.getElementsByTagName("Valute");
            for (int i = 0; i < valutes.getLength(); i++) {
                var node = valutes.item(i);
                var charCode = getTextContent(node, "CharCode");
                if (!TARGET_CURRENCY.equals(charCode)) {
                    continue;
                }
                String nominalStr = getTextContent(node, "Nominal");
                String valueStr = getTextContent(node, "Value");
                if (nominalStr == null || valueStr == null || nominalStr.isBlank() || valueStr.isBlank()) {
                    return Optional.empty();
                }
                valueStr = valueStr.replace(',', '.');
                var nominal = new BigDecimal(nominalStr.strip());
                var valueRub = new BigDecimal(valueStr.strip());
                if (valueRub.compareTo(BigDecimal.ZERO) == 0) {
                    return Optional.empty();
                }
                var rate = nominal.divide(valueRub, RATE_SCALE, RoundingMode.HALF_UP);
                return Optional.of(rate);
            }
            log.warn("KRW not found in CBR feed");
            return Optional.empty();
        } catch (Exception e) {
            log.error("Failed to parse CBR XML", e);
            return Optional.empty();
        }
    }

    private static String getTextContent(org.w3c.dom.Node parent, String tagName) {
        var list = parent.getChildNodes();
        for (int i = 0; i < list.getLength(); i++) {
            var child = list.item(i);
            if (child.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE && tagName.equals(child.getNodeName())) {
                return child.getTextContent();
            }
        }
        return null;
    }
}
