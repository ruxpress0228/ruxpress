package com.ruxpress.domain.exchange.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ruxpress.domain.exchange.service.ExchangeService;

// TODO: Exchange API 엔드포인트 구현
@RestController
@RequestMapping("/api/v1/exchange-rates")
@RequiredArgsConstructor
public class ExchangeController {

    private final ExchangeService exchangeService;
}
