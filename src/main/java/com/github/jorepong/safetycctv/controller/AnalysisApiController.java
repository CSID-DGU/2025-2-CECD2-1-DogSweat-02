package com.github.jorepong.safetycctv.controller;

import com.github.jorepong.safetycctv.alert.AlertService;
import com.github.jorepong.safetycctv.alert.AlertTrend;
import com.github.jorepong.safetycctv.alert.dto.AlertHistoryQuery;
import com.github.jorepong.safetycctv.alert.dto.AlertHistoryResponse;
import com.github.jorepong.safetycctv.alert.dto.RecentAlertPayload;
import com.github.jorepong.safetycctv.analysis.AnalysisInsightsService;
import com.github.jorepong.safetycctv.analysis.CameraAnalyticsSummary;
import com.github.jorepong.safetycctv.analysis.StageAlertView;
import com.github.jorepong.safetycctv.analysis.dto.AnalysisCameraPayload;
import com.github.jorepong.safetycctv.analysis.dto.CameraStatusPayload;
import com.github.jorepong.safetycctv.analysis.dto.StageAlertPayload;
import com.github.jorepong.safetycctv.dashboard.DashboardCameraView;
import com.github.jorepong.safetycctv.dashboard.DashboardSummary;
import com.github.jorepong.safetycctv.entity.AnalysisLog;
import com.github.jorepong.safetycctv.entity.Camera;
import com.github.jorepong.safetycctv.camera.CameraService;
import com.github.jorepong.safetycctv.repository.AnalysisLogRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AnalysisApiController {

    private final AnalysisLogRepository analysisLogRepository;
    private final AnalysisInsightsService analysisInsightsService;
    private final CameraService cameraService;
    private final AlertService alertService;

    @GetMapping("/cameras/analytics-summary")
    public ResponseEntity<List<CameraStatusPayload>> getAnalyticsSummaryForAllCameras() {
        List<Camera> cameras = cameraService.fetchAll();
        Map<Long, CameraAnalyticsSummary> summaries = analysisInsightsService.summarizeCameras(cameras);
        List<CameraStatusPayload> payloads = summaries.values().stream()
            .map(CameraStatusPayload::from)
            .toList();
        return ResponseEntity.ok(payloads);
    }

    @GetMapping("/cameras/{cameraId}/latest-snapshot-path")
    public ResponseEntity<Map<String, String>> getLatestSnapshotPath(@PathVariable Long cameraId) {
        Optional<AnalysisLog> latestLogOpt = analysisLogRepository.findFirstByCameraIdOrderByTimestampDesc(cameraId);

        if (latestLogOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String imagePath = latestLogOpt.get().getAnnotatedImagePath();
        if (imagePath == null || imagePath.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        String webPath = "/media/" + imagePath.replace("\\", "/");
        return ResponseEntity.ok(Map.of("path", webPath));
    }

    @GetMapping("/cameras/{cameraId}/alerts")
    public ResponseEntity<List<StageAlertPayload>> getCameraAlerts(
        @PathVariable Long cameraId,
        @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        List<StageAlertView> alerts = analysisInsightsService.findStageAlerts(cameraId, limit);
        List<StageAlertPayload> payloads = alerts.stream()
            .map(StageAlertPayload::from)
            .toList();
        return ResponseEntity.ok(payloads);
    }

    @GetMapping("/cameras/{cameraId}/analytics")
    public ResponseEntity<AnalysisCameraPayload> getCameraAnalytics(@PathVariable Long cameraId) {
        Optional<Camera> cameraOpt = cameraService.findById(cameraId);
        if (cameraOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return analysisInsightsService.summarizeCamera(cameraOpt.get())
            .map(AnalysisCameraPayload::from)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/alerts/recent")
    public ResponseEntity<List<RecentAlertPayload>> getRecentAlerts(
        @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        List<RecentAlertPayload> payloads = alertService.getRecentAlerts(limit).stream()
            .map(RecentAlertPayload::from)
            .toList();
        return ResponseEntity.ok(payloads);
    }

    @GetMapping("/alerts/history")
    public AlertHistoryResponse getAlertHistory(
        @RequestParam(value = "page", required = false) Integer page,
        @RequestParam(value = "size", required = false) Integer size,
        @RequestParam(value = "sort", required = false) String sort,
        @RequestParam(value = "level", required = false) String level,
        @RequestParam(value = "cameraId", required = false) Long cameraId,
        @RequestParam(value = "search", required = false) String search,
        @RequestParam(value = "start", required = false) String start,
        @RequestParam(value = "end", required = false) String end
    ) {
        AlertHistoryQuery query = AlertHistoryQuery.of(page, size, sort, level, cameraId, search, start, end);
        return alertService.getAlertHistory(query);
    }

    @GetMapping("/alerts/trend")
    public AlertTrend getAlertsTrend() {
        return alertService.getHourlyTrendForLast24Hours();
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummary> getDashboardSummary() {
        List<Camera> allCameras = cameraService.fetchAll();
        List<DashboardCameraView> streamingCameras = allCameras.stream()
            .map(DashboardCameraView::from)
            .flatMap(Optional::stream)
            .toList();
        Map<Long, CameraAnalyticsSummary> summaries = analysisInsightsService.summarizeCameras(allCameras);
        DashboardSummary baseSummary =
            analysisInsightsService.buildDashboardSummary(allCameras, streamingCameras, summaries);
        DashboardSummary enriched = new DashboardSummary(
            baseSummary.totalCameras(),
            baseSummary.streamingCameras(),
            baseSummary.camerasWithData(),
            baseSummary.camerasInDanger(),
            alertService.countRecentAlertsSince(LocalDateTime.now().minusMinutes(30))
        );
        return ResponseEntity.ok(enriched);
    }
}
