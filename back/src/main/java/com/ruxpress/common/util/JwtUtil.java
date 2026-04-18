package com.ruxpress.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserIdFromToken(String token) {
        String sub = parseToken(token).getSubject();
        return sub == null ? null : Long.parseLong(sub);
    }

    /**
     * {@code Authorization: Bearer …} 에서 일반 회원 JWT만 해석해 userId를 반환한다.
     * 관리자 JWT({@code role} 클레임 존재)는 {@code null}.
     */
    public Long resolveUserIdFromAuthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null) {
            return null;
        }
        String[] parts = authorizationHeader.trim().split("\\s+", 2);
        if (parts.length != 2 || !parts[0].equalsIgnoreCase("Bearer")) {
            return null;
        }
        String token = parts[1].trim();
        if (token.isEmpty()) {
            return null;
        }
        try {
            Claims c = parseToken(token);
            if (c.get("role") != null) {
                return null;
            }
            String sub = c.getSubject();
            return sub == null ? null : Long.parseLong(sub);
        } catch (Exception e) {
            return null;
        }
    }
}
