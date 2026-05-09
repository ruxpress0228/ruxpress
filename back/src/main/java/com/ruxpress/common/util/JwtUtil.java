package com.ruxpress.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private long expiration;

    private static SecretKey key;
    private static long expirationMs;

    @PostConstruct
    private void init() {
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        expirationMs = expiration;
    }

    public static String generateToken(Long userId, String email) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public static Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Authorization 헤더에서 일반 회원 JWT의 userId를 반환한다. 관리자 JWT(role 클레임 존재)는 null.
     */
    public static Long getUserId(HttpServletRequest request) {
        if (request == null)
            return null;

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null)
            return null;

        String[] parts = header.trim().split("\\s+", 2);
        if (parts.length != 2 || !parts[0].equalsIgnoreCase("Bearer"))
            return null;

        String token = parts[1].trim();
        if (token.isEmpty())
            return null;

        try {
            Claims c = parseToken(token);
            if (c.get("role") != null)
                return null;
            String sub = c.getSubject();
            return sub == null ? null : Long.parseLong(sub);
        } catch (Exception e) {
            return null;
        }
    }
}
