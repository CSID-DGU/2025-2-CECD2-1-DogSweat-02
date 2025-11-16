package com.github.jorepong.safetycctv;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SafetyCctvApplication {

    public static void main(String[] args) {
        SpringApplication.run(SafetyCctvApplication.class, args);
    }

}
