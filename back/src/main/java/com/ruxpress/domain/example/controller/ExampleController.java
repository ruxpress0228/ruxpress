package com.ruxpress.domain.example.controller;

import com.ruxpress.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/examples")
@RequiredArgsConstructor
public class ExampleController {

    private final MessageSource messageSource;

    @GetMapping("/hello")
    public ApiResponse<Map<String, String>> hello(Locale locale) {
        String message = messageSource.getMessage("hello.message", null, locale);
        return ApiResponse.success(Map.of(
                "message", message,
                "locale", locale.getLanguage()
        ));
    }

    @GetMapping("/time")
    public ApiResponse<Map<String, String>> time() {
        return ApiResponse.success(Map.of(
                "serverTime", LocalDateTime.now(ZoneOffset.UTC).toString(),
                "timezone", "UTC"
        ));
    }

    @PostMapping("/echo")
    public ApiResponse<Map<String, Object>> echo(@RequestBody Map<String, Object> body) {
        return ApiResponse.success(body);
    }
}
