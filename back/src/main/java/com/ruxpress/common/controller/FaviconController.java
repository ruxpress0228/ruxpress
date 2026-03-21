package com.ruxpress.common.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 브라우저가 자동 요청하는 /favicon.ico 를 처리해 NoResourceFoundException(ERROR 로그) 방지.
 */
@RestController
public class FaviconController {

    @GetMapping("favicon.ico")
    public ResponseEntity<Void> favicon() {
        return ResponseEntity.noContent().build();
    }
}
