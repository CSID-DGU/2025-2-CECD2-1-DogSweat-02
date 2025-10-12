package com.github.jorepong.safetycctv.camera;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CameraRepository extends JpaRepository<Camera, Long> {

    long countByStatus(CameraStatus status);

    List<Camera> findAllByOrderByCreatedAtDesc();
}
