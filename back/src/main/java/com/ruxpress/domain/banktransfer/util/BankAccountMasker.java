package com.ruxpress.domain.banktransfer.util;

public final class BankAccountMasker {

    private BankAccountMasker() {
    }

    public static String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return "";
        }
        String digits = accountNumber.replaceAll("\\s", "");
        if (digits.length() <= 4) {
            return "*".repeat(digits.length());
        }
        return "*".repeat(Math.min(6, digits.length() - 4)) + digits.substring(digits.length() - 4);
    }
}
