package com.ruxpress.common.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String root() {
        return """
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1"/>
                  <title>Main Proxy API</title>
                  <style>
                    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }
                    h1 { font-size: 1.25rem; }
                    a { color: #2563eb; }
                    code { background: #f4f4f5; padding: 0.15rem 0.35rem; border-radius: 4px; }
                  </style>
                </head>
                <body>
                  <h1>Main Proxy 백엔드 (Spring Boot)</h1>
                  <p>이 주소(<code>http://localhost:8080</code>)는 API 서버입니다. 웹 화면은 프론트 개발 서버에서 띄웁니다.</p>
                  <ul>
                    <li><a href="/api/health">헬스 체크</a> — <code>GET /api/health</code></li>
                    <li><a href="/h2-console">H2 콘솔</a> (local 프로필)</li>
                  </ul>
                  <p>프론트: <code>front</code>에서 <code>npm run dev</code> — 기본 <code>http://localhost:3000</code> (<code>VITE_PORT</code>로 변경 가능)</p>
                </body>
                </html>
                """;
    }
}
