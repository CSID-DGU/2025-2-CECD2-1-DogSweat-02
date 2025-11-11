package com.github.jorepong.safetycctv.controller;

import com.github.jorepong.safetycctv.camera.CameraService;
import com.github.jorepong.safetycctv.dashboard.DashboardCameraView;
import com.github.jorepong.safetycctv.map.MapCameraView;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
public class WebController {

    private final CameraService cameraService;

    @Value("${naver.map.client-id:}")
    private String naverMapClientId;

    @GetMapping("/")
    public String dashboard(
        @RequestParam(value = "cameraId", required = false) Long cameraId,
        Model model
    ) {
        List<DashboardCameraView> streamingCameras = cameraService.fetchYoutubeCameras();
        DashboardCameraView primaryCamera = streamingCameras.stream()
            .filter(camera -> Objects.equals(camera.id(), cameraId))
            .findFirst()
            .orElse(streamingCameras.stream().findFirst().orElse(null));

        model.addAttribute("streamingCameras", streamingCameras);
        model.addAttribute("primaryCamera", primaryCamera);
        return "dashboard";
    }

    @GetMapping("/analysis")
    public String analysisPage() {
        return "analysis";
    }

    @GetMapping("/analysis/comparison")
    public String comparisonPage() {
        return "comparison";
    }

    @GetMapping("/map")
    public String mapPage(Model model) {
        List<MapCameraView> cameras = cameraService.fetchAll().stream()
            .map(MapCameraView::from)
            .filter(Objects::nonNull)
            .toList();
        model.addAttribute("mapCameras", cameras);
        model.addAttribute("naverMapClientId", naverMapClientId);
        return "map";
    }

    @GetMapping("/alerts")
    public String alertsPage() {
        return "alerts";
    }

}
