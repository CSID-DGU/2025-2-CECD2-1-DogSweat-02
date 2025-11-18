package com.github.jorepong.safetycctv.config;

import com.github.jorepong.safetycctv.camera.CameraRepository;
import com.github.jorepong.safetycctv.camera.CameraStatus;
import com.github.jorepong.safetycctv.camera.StreamType;
import com.github.jorepong.safetycctv.entity.Camera;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDateTime;

@Configuration
@Profile("dev") // Only activate this bean in 'dev' profile
public class DevDataInitializer {

    @Bean
    public CommandLineRunner initDevData(CameraRepository cameraRepository) {
        return args -> {
            // Insert data only if the table is empty
            if (cameraRepository.count() == 0) {
                Camera camera = new Camera();
                camera.setName("as");
                camera.setStreamUrl("https://www.youtube.com/watch?v=DjdUEyjx8GM");
                camera.setStreamType(StreamType.YOUTUBE);
                camera.setLocationZone(null);
                camera.setStatus(CameraStatus.HEALTHY);
                camera.setDescription("a");
                camera.setAddress("서울특별시 중구 다동 남대문로9길 24 패스트파이브타워");
                camera.setLatitude(37.56714);
                camera.setLongitude(126.981165);

                cameraRepository.save(camera);
                System.out.println("Development camera data inserted.");
            } else {
                System.out.println("Development camera data already exists.");
            }
        };
    }
}
