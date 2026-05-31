package com.ruxpress.domain.chat.entity;

import java.util.Arrays;

public enum ChatRetentionPeriod {
    PERMANENT(0),
    MONTHS_1(1),
    MONTHS_3(3),
    MONTHS_6(6),
    MONTHS_12(12),
    MONTHS_24(24);

    private final int months;

    ChatRetentionPeriod(int months) {
        this.months = months;
    }

    public int getMonths() {
        return months;
    }

    public boolean isPermanent() {
        return this == PERMANENT;
    }

    public static ChatRetentionPeriod fromValue(String value) {
        if (value == null || value.isBlank()) {
            return PERMANENT;
        }
        return Arrays.stream(values())
                .filter(p -> p.name().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElse(PERMANENT);
    }
}
