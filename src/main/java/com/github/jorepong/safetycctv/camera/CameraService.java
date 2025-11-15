package com.github.jorepong.safetycctv.camera;

import com.github.jorepong.safetycctv.dashboard.DashboardCameraView;
import com.github.jorepong.safetycctv.entity.Camera;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CameraService {

    private final CameraRepository cameraRepository;

    public List<Camera> fetchAll() {
        return cameraRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Camera create(CameraForm form) {
        return cameraRepository.save(form.toEntity());
    }

    @Transactional
    public void delete(Long cameraId) {
        if (cameraId == null) {
            return;
        }
        if (cameraRepository.existsById(cameraId)) {
            cameraRepository.deleteById(cameraId);
        }
    }

    public CameraSummary summarize() {
        long total = cameraRepository.count();
        long healthy = cameraRepository.countByStatus(CameraStatus.HEALTHY);
        long warning = cameraRepository.countByStatus(CameraStatus.WARNING);
        long offline = cameraRepository.countByStatus(CameraStatus.OFFLINE);
        return new CameraSummary(total, healthy, warning, offline);
    }

    public List<DashboardCameraView> fetchYoutubeCameras() {
        return cameraRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(DashboardCameraView::from)
            .flatMap(Optional::stream)
            .toList();
    }
}
