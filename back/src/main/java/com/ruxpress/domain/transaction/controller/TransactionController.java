package com.ruxpress.domain.transaction.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ruxpress.domain.transaction.service.TransactionService;

// TODO: Transaction API 엔드포인트 구현
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
}
