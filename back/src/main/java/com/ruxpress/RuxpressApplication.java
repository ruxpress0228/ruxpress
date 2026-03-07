package com.ruxpress;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RuxpressApplication {

    public static void main(String[] args) {
        SpringApplication.run(RuxpressApplication.class, args);
    }
}
