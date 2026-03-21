package com.ruxpress.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * 메일 발송 설정. .env / 환경 변수에서 읽은 username, password를 trim하여 사용합니다.
 * (Docker env_file 등에서 공백·줄바꿈이 붙는 경우 인증 실패 방지)
 */
@Configuration
public class MailConfig {

    @Bean
    @Primary
    public JavaMailSender javaMailSender(Environment env) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(env.getProperty("spring.mail.host", "smtp.gmail.com"));
        sender.setPort(Integer.parseInt(env.getProperty("spring.mail.port", "587")));
        String username = env.getProperty("spring.mail.username", "");
        String password = env.getProperty("spring.mail.password", "");
        sender.setUsername(username != null ? username.trim() : "");
        sender.setPassword(password != null ? password.trim() : "");

        Properties props = new Properties();
        props.put("mail.smtp.auth", env.getProperty("spring.mail.properties.mail.smtp.auth", "true"));
        props.put("mail.smtp.starttls.enable", env.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "true"));
        sender.setJavaMailProperties(props);

        return sender;
    }
}
