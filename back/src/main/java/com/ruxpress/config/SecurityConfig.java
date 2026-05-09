package com.ruxpress.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/v1/webhooks/**").permitAll()
                        .requestMatchers("/api/v1/admin/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/admin/settlement-accounts/**")
                        .hasAnyRole("SUPER_ADMIN", "COUNSELOR")
                        .requestMatchers("/api/v1/admin/settlement-accounts/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/admin/bank-transfers/**")
                        .hasAnyRole("SUPER_ADMIN", "COUNSELOR")
                        .requestMatchers("/api/v1/admin/bank-transfers/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/v1/admin/admins/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/v1/admin/users/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/v1/admin/notices/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/v1/admin/settings/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/v1/admin/inquiries/**").hasAnyRole("SUPER_ADMIN", "COUNSELOR")
                        .requestMatchers("/api/v1/admin/stats/**").hasAnyRole("SUPER_ADMIN", "COUNSELOR")
                        .requestMatchers("/api/v1/admin/**").hasAnyRole("SUPER_ADMIN", "COUNSELOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/notices/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
