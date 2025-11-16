package com.github.jorepong.safetycctv.analysis;

import com.github.jorepong.safetycctv.camera.CameraRepository;
import com.github.jorepong.safetycctv.camera.TrainingStatus;
import com.github.jorepong.safetycctv.dashboard.DashboardCameraView;
import com.github.jorepong.safetycctv.dashboard.DashboardSummary;
import com.github.jorepong.safetycctv.entity.AnalysisLog;
import com.github.jorepong.safetycctv.entity.Camera;
import com.github.jorepong.safetycctv.repository.AnalysisLogRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalysisInsightsService {

    private static final double CAUTION_THRESHOLD = 0.30;
    private static final double DANGER_THRESHOLD = 0.60;
    private static final long ETA_NOTICE_WINDOW_SECONDS = 600;
    private static final int RECENT_SAMPLE_LIMIT = 3;
    private static final int DEFAULT_ALERT_LIMIT = 10;

    private final AnalysisLogRepository analysisLogRepository;
    private final CameraRepository cameraRepository;

    public Map<Long, CameraAnalyticsSummary> summarizeCameras(List<Camera> cameras) {
        if (cameras == null || cameras.isEmpty()) {
            return Map.of();
        }
        return cameras.stream()
            .map(camera -> summarizeCamera(camera).orElseGet(() -> buildEmptySummary(camera)))
            .collect(Collectors.toMap(CameraAnalyticsSummary::cameraId, summary -> summary));
    }

    public Optional<CameraAnalyticsSummary> summarizeCamera(Camera camera) {
        if (camera == null) {
            return Optional.empty();
        }

        TrainingStatus trainingStatus = camera.getTrainingStatus();
        if (trainingStatus == TrainingStatus.PENDING) {
            log.debug("[Summary] Camera {} pending training. Returning empty summary.", camera.getId());
            return Optional.of(buildEmptySummary(camera));
        }

        List<AnalysisLog> logs = loadRecentLogs(camera);
        if (logs.isEmpty()) {
            log.debug("[Summary] Camera {} has no analysis logs. Returning empty summary.", camera.getId());
            return Optional.of(buildEmptySummary(camera));
        }
        return Optional.of(buildSummary(camera, logs));
    }

    public List<StageAlertView> findStageAlerts(Long cameraId, int limit) {
        if (cameraId == null) {
            return List.of();
        }

        var cameraOpt = cameraRepository.findById(cameraId);
        if (cameraOpt.isEmpty()) {
            return List.of();
        }
        Camera camera = cameraOpt.get();
        if (camera.getTrainingStatus() == TrainingStatus.PENDING) {
            log.debug("[StageAlerts] Camera {} is pending training. Skipping alert timeline build.", camera.getId());
            return List.of();
        }

        int normalizedLimit = Math.max(1, Math.min(limit, 50));
        List<AnalysisLog> logs = loadRecentLogs(camera);
        if (logs.isEmpty()) {
            return List.of();
        }
        return buildStageAlertsTimeline(logs, normalizedLimit);
    }

    public List<StageAlertView> findStageAlertsSince(Long cameraId, LocalDateTime since) {
        if (cameraId == null || since == null) {
            return List.of();
        }

        var cameraOpt = cameraRepository.findById(cameraId);
        if (cameraOpt.isEmpty()) {
            return List.of();
        }
        Camera camera = cameraOpt.get();
        if (camera.getTrainingStatus() == TrainingStatus.PENDING) {
            log.debug("[StageAlerts] Camera {} pending training for since-query; returning empty.", camera.getId());
            return List.of();
        }

        List<AnalysisLog> logs = loadLogsSince(camera, since);
        if (logs.isEmpty()) {
            return List.of();
        }
        return buildStageAlertsTimeline(logs, Integer.MAX_VALUE);
    }

    public DashboardSummary buildDashboardSummary(
        List<Camera> allCameras,
        List<DashboardCameraView> streamingCameras,
        Map<Long, CameraAnalyticsSummary> summaries
    ) {
        long total = allCameras != null ? allCameras.size() : 0;
        long streaming = streamingCameras != null ? streamingCameras.size() : 0;
        var dataSummaries = summaries != null ? summaries.values() : List.<CameraAnalyticsSummary>of();

        long camerasWithData = dataSummaries.stream().filter(CameraAnalyticsSummary::hasData).count();
        long dangerCameras = dataSummaries.stream()
            .filter(summary -> summary.hasData() && summary.level() == CongestionLevel.DANGER)
            .count();

        long recentEvents = analysisLogRepository.countValidLogsSince(
            LocalDateTime.now().minusMinutes(30),
            TrainingStatus.PENDING
        );

        return new DashboardSummary(
            total,
            streaming,
            camerasWithData,
            dangerCameras,
            recentEvents
        );
    }

    private record EtaResult(Long seconds, EtaType type, String message) {
        static final EtaResult NONE = new EtaResult(null, EtaType.NONE, "현재 추세상 위험 단계 변동 징후 없음");
    }

    private record DangerWindow(Long seconds, LocalDateTime since) {
        static final DangerWindow EMPTY = new DangerWindow(0L, null);
    }

    private CameraAnalyticsSummary buildSummary(Camera camera, List<AnalysisLog> logsDesc) {
        AnalysisLog latest = logsDesc.get(0);
        List<AnalysisLog> ascLogs = new ArrayList<>(logsDesc);
        Collections.reverse(ascLogs);
        List<DensitySample> densitySeries = ascLogs.stream()
            .map(log -> new DensitySample(log.getTimestamp(), log.getDensity(), log.getPersonCount()))
            .toList();

        Double velocity = convertVelocityToPerMinute(latest.getDensityVelocity());
        Double acceleration = convertAccelerationToPerMinute2(latest.getDensityAcceleration());
        EtaResult eta = computeEta(latest.getDensity(), velocity, acceleration);
        DangerWindow dangerWindow = computeDangerWindow(logsDesc);
        CongestionLevel level = resolveLevel(latest.getDensity());
        List<StageAlertView> stageAlerts = (camera.getTrainingStatus() == TrainingStatus.PENDING)
            ? List.of()
            : buildStageAlertsTimeline(logsDesc, DEFAULT_ALERT_LIMIT);

        return new CameraAnalyticsSummary(
            camera.getId(),
            camera.getName(),
            true,
            level,
            latest.getDensity(),
            latest.getPersonCount(),
            latest.getTimestamp(),
            velocity,
            acceleration,
            eta.seconds(),
            eta.type(),
            eta.message(),
            dangerWindow.seconds(),
            dangerWindow.since(),
            densitySeries,
            stageAlerts,
            camera.getTrainingStatus() // Pass trainingStatus from camera
        );
    }

    private CameraAnalyticsSummary buildEmptySummary(Camera camera) {
        TrainingStatus trainingStatus = camera != null && camera.getTrainingStatus() != null
            ? camera.getTrainingStatus()
            : TrainingStatus.UNKNOWN;
        return new CameraAnalyticsSummary(
            camera.getId(),
            camera.getName(),
            false,
            CongestionLevel.NO_DATA,
            null,
            null,
            null,
            null,
            null,
            null,
            EtaType.NONE,
            "ETA 정보 없음",
            0L,
            null,
            List.of(),
            List.of(),
            trainingStatus
        );
    }

    private List<AnalysisLog> loadRecentLogs(Camera camera) {
        if (camera == null) {
            return List.of();
        }
        LocalDateTime readySince = camera.getTrainingReadyAt();
        if (readySince != null) {
            return analysisLogRepository.findTop60ByCameraIdAndTimestampGreaterThanEqualOrderByTimestampDesc(
                camera.getId(),
                readySince
            );
        }
        return analysisLogRepository.findTop60ByCameraIdOrderByTimestampDesc(camera.getId());
    }

    private List<AnalysisLog> loadLogsSince(Camera camera, LocalDateTime since) {
        if (camera == null) {
            return List.of();
        }
        LocalDateTime effectiveSince = since;
        LocalDateTime readySince = camera.getTrainingReadyAt();
        if (readySince != null) {
            if (effectiveSince == null || effectiveSince.isBefore(readySince)) {
                effectiveSince = readySince;
            }
        }
        if (effectiveSince == null) {
            return loadRecentLogs(camera);
        }
        return analysisLogRepository.findByCameraIdAndTimestampGreaterThanEqualOrderByTimestampDesc(
            camera.getId(),
            effectiveSince
        );
    }

    private Double convertVelocityToPerMinute(Double velocityPerSecond) {
        if (velocityPerSecond == null) {
            return null;
        }
        return velocityPerSecond * 60d;
    }

    private Double convertAccelerationToPerMinute2(Double accelerationPerSecond2) {
        if (accelerationPerSecond2 == null) {
            return null;
        }
        return accelerationPerSecond2 * 3600d;
    }

    private EtaResult computeEta(Double currentDensity, Double velocity, Double acceleration) {
        if (currentDensity == null) {
            return new EtaResult(null, EtaType.NONE, "최근 분석 데이터 부족");
        }
        if (velocity == null) {
            return new EtaResult(null, EtaType.NONE, "추세 계산 표본 부족");
        }

        double v = velocity;
        double a = acceleration != null ? acceleration : 0d;

        if (currentDensity < DANGER_THRESHOLD && v > 0) {
            Optional<Long> seconds = calculateEtaForThreshold(currentDensity, v, a, DANGER_THRESHOLD);
            if (seconds.isEmpty()) {
                return new EtaResult(null, EtaType.NONE, "추세 변동성 높아 위험 진입 ETA 산출 불가");
            }
            long etaSeconds = seconds.get();
            return new EtaResult(
                etaSeconds,
                EtaType.ENTERING_DANGER,
                "약 " + formatMinutes(etaSeconds) + " 후 '위험' 진입 예상"
            );
        }

        if (currentDensity >= DANGER_THRESHOLD && v < 0) {
            Optional<Long> seconds = calculateEtaForThreshold(currentDensity, v, a, DANGER_THRESHOLD);
            if (seconds.isEmpty()) {
                return new EtaResult(null, EtaType.NONE, "추세 변동성 높아 위험 완화 ETA 산출 불가");
            }
            long etaSeconds = seconds.get();
            return new EtaResult(
                etaSeconds,
                EtaType.EXITING_DANGER,
                "약 " + formatMinutes(etaSeconds) + " 후 '주의' 복귀 예상"
            );
        }

        return new EtaResult(null, EtaType.NONE, "현재 추세상 위험 단계 변동 징후 없음");
    }

    private Optional<Long> calculateEtaForThreshold(double currentDensity, double v, double a, double targetThreshold) {
        double diff = currentDensity - targetThreshold;

        if (Math.abs(a) < 1e-6) { // Linear case (no acceleration)
            if (Math.abs(v) < 1e-6) return Optional.empty();
            double minutes = -diff / v;
            return (minutes > 0) ? Optional.of((long) Math.round(minutes * 60)) : Optional.empty();
        }

        // Quadratic case
        double A = 0.5 * a;
        double B = v;
        double C = diff;
        double discriminant = B * B - 4 * A * C;

        if (discriminant < 0) {
            return Optional.empty();
        }

        double sqrt = Math.sqrt(discriminant);
        double denom = 2 * A;
        double t1 = (-B + sqrt) / denom;
        double t2 = (-B - sqrt) / denom;

        return pickPositiveMinimum(t1, t2)
            .map(minutes -> (long) Math.round(minutes * 60));
    }


    private Optional<Double> pickPositiveMinimum(double t1, double t2) {
        Double candidate = null;
        if (t1 > 0) {
            candidate = t1;
        }
        if (t2 > 0) {
            if (candidate == null || t2 < candidate) {
                candidate = t2;
            }
        }
        return Optional.ofNullable(candidate);
    }

    private DangerWindow computeDangerWindow(List<AnalysisLog> logs) {
        if (logs.isEmpty() || logs.get(0).getDensity() < DANGER_THRESHOLD) {
            return DangerWindow.EMPTY;
        }

        LocalDateTime end = logs.get(0).getTimestamp();
        LocalDateTime start = end;

        for (int i = 1; i < logs.size(); i++) {
            AnalysisLog log = logs.get(i);
            if (log.getDensity() < DANGER_THRESHOLD) {
                break;
            }
            start = log.getTimestamp();
        }

        long seconds = Duration.between(start, end).getSeconds();
        long safeSeconds = Math.max(seconds, 0L);
        return new DangerWindow(safeSeconds, start);
    }

    private CongestionLevel resolveLevel(Double density) {
        if (density == null) {
            return CongestionLevel.NO_DATA;
        }
        if (density >= DANGER_THRESHOLD) {
            return CongestionLevel.DANGER;
        }
        if (density >= CAUTION_THRESHOLD) {
            return CongestionLevel.CAUTION;
        }
        return CongestionLevel.FREE;
    }

    private List<StageAlertView> buildStageAlertsTimeline(List<AnalysisLog> logs, int limit) {
        List<StageAlertView> alerts = new ArrayList<>();
        if (logs.isEmpty() || limit <= 0) {
            return alerts;
        }

        for (int i = 0; i < logs.size() && alerts.size() < limit; i++) {
            AnalysisLog current = logs.get(i);
            AnalysisLog previous = i + 1 < logs.size() ? logs.get(i + 1) : null;

            Double velocity = convertVelocityToPerMinute(current.getDensityVelocity());
            Double acceleration = convertAccelerationToPerMinute2(current.getDensityAcceleration());
            EtaResult eta = computeEta(current.getDensity(), velocity, acceleration);

            List<StageAlertView> events = buildAlertsForLog(current, previous, velocity, eta);
            for (StageAlertView view : events) {
                alerts.add(view);
                if (alerts.size() >= limit) {
                    break;
                }
            }
        }

        return alerts;
    }

    private List<StageAlertView> buildAlertsForLog(
        AnalysisLog current,
        AnalysisLog previous,
        Double velocity,
        EtaResult eta
    ) {
        List<StageAlertView> alerts = new ArrayList<>();
        LocalDateTime timestamp = current.getTimestamp();
        double density = current.getDensity();

        if (eta.type() == EtaType.ENTERING_DANGER
            && eta.seconds() != null
            && eta.seconds() > 0
            && eta.seconds() <= ETA_NOTICE_WINDOW_SECONDS) {
            alerts.add(new StageAlertView(
                "A1",
                "위험 임박",
                "약 " + formatMinutes(eta.seconds()) + " 후 위험 수위 도달 예상",
                StageSeverity.WARNING,
                timestamp
            ));
        }

        if (density >= DANGER_THRESHOLD) {
            alerts.add(new StageAlertView(
                "A3",
                "위험 수위 돌파",
                String.format("밀집도 %.2f가 임계 %.2f를 초과했습니다.", density, DANGER_THRESHOLD),
                StageSeverity.DANGER,
                timestamp
            ));

            if (velocity != null && velocity > 0.02) {
                alerts.add(new StageAlertView(
                    "A4",
                    "혼잡 심화",
                    String.format("분당 +%.2f포인트 속도로 증가 중", velocity * 100),
                    StageSeverity.DANGER,
                    timestamp
                ));
            }
        } else if (previous != null && previous.getDensity() >= DANGER_THRESHOLD) {
            alerts.add(new StageAlertView(
                "A6",
                "위험 해소",
                "밀집도가 위험 기준 아래로 감소했습니다.",
                StageSeverity.INFO,
                timestamp
            ));
        }

        return alerts;
    }

    private String formatMinutes(long etaSeconds) {
        long minutes = (long) Math.ceil(etaSeconds / 60d);
        return minutes + "분";
    }
}

