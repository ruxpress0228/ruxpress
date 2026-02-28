package com.ruxpress.domain.balance.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ruxpress.domain.balance.service.BalanceService;

// TODO: Balance API 엔드포인트 구현
@RestController
@RequestMapping("/api/v1/balances")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;
}
