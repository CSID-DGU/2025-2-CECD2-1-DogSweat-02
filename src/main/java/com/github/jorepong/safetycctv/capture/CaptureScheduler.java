package com.github.jorepong.safetycctv.capture;

import com.github.jorepong.safetycctv.camera.CameraService;
import com.github.jorepong.safetycctv.camera.TrainingStatus;
import com.github.jorepong.safetycctv.capture.dto.AiAnalysisResponse;
import com.github.jorepong.safetycctv.capture.dto.PerspectiveMapTrainingResponse;
import com.github.jorepong.safetycctv.entity.Camera;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class CaptureScheduler {

    private final CameraService cameraService;
    private final WebClient webClient;
    private final TrainingScheduleTracker trainingScheduleTracker;
    private final PerspectiveTrainingDataPruner perspectiveTrainingDataPruner;

    public CaptureScheduler(
        CameraService cameraService,
        WebClient.Builder webClientBuilder,
        @Value("${ai.server.base-url}") String aiServerBaseUrl,
        TrainingScheduleTracker trainingScheduleTracker,
        PerspectiveTrainingDataPruner perspectiveTrainingDataPruner
    ) {
        this.cameraService = cameraService;
        this.webClient = webClientBuilder.baseUrl(aiServerBaseUrl).build();
        this.trainingScheduleTracker = trainingScheduleTracker;
        this.perspectiveTrainingDataPruner = perspectiveTrainingDataPruner;
    }

    /**
     * Periodically triggers the AI server to process all registered cameras.
     * Runs every 30 seconds, as per the project plan.
     */
    @Scheduled(initialDelay = 10000, fixedRate = 30000)
    public void triggerAnalysisForAllCameras() {
        log.info("--- Starting scheduled AI analysis trigger task ---");
        List<Camera> cameras = cameraService.fetchAll();

        if (cameras.isEmpty()) {
            log.info("No cameras registered. Skipping AI trigger task.");
            return;
        }

        log.info("Found {} cameras to process. Triggering AI server.", cameras.size());

        Flux.fromIterable(cameras)
            .flatMap(this::requestAnalysis)
            .doOnComplete(() -> log.info("--- Finished scheduled AI analysis trigger task ---"))
            .subscribe(
                unused -> { },
                error -> log.error("Unexpected error while triggering AI analysis", error)
            );
    }

    /**
     * Periodically triggers the AI server to train perspective maps for all cameras.
     * Runs every hour.
     */
    @Scheduled(initialDelay = 600000, fixedRate = 3600000) // 10-min delay, 1-hour rate
    public void triggerPerspectiveMapTraining() {
        log.info("--- Starting scheduled perspective map training task ---");
        // Set the next training time as soon as the task starts
        trainingScheduleTracker.updateNextTrainingTime(LocalDateTime.now().plusHours(1));
        perspectiveTrainingDataPruner.pruneAllCameras();

        webClient.post()
            .uri("/api/v1/perspective-map/train/")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Collections.emptyMap()) // Empty body to train all cameras
            .retrieve()
            .bodyToMono(PerspectiveMapTrainingResponse.class)
            .doOnSuccess(response -> {
                if ("SUCCESS".equals(response.getStatus())) {
                    log.info("Perspective map training finished. {}", response.getMessage());
                    response.getTrainedCameras().forEach(cam ->
                        log.info("  - Trained: {} ({} samples)", cam.getCameraName(), cam.getSamplesUsed())
                    );
                    response.getSkippedCameras().forEach(cam ->
                        log.warn("  - Skipped: Camera ID {} (Reason: {}, Samples: {})", cam.getCameraId(), cam.getReason(), cam.getSamplesAvailable())
                    );
                } else {
                    log.error("Perspective map training failed. Response: {}", response);
                }
            })
            .onErrorResume(WebClientResponseException.class, ex -> {
                log.error(
                    "AI server returned {} during perspective map training. Body: {}",
                    ex.getStatusCode(),
                    ex.getResponseBodyAsString()
                );
                return Mono.empty();
            })
            .onErrorResume(WebClientRequestException.class, ex -> {
                log.error("Failed to reach AI server for perspective map training: {}", ex.getMessage());
                return Mono.empty();
            })
            .onErrorResume(ex -> {
                log.error("Unexpected error during perspective map training", ex);
                return Mono.empty();
            })
            .subscribe();
    }

    /**
     * Sends a request to the AI server to process a single camera.
     *
     * @param camera The camera to be processed.
     * @return A Mono representing the completion of the web client call.
     */
    private Mono<Void> requestAnalysis(Camera camera) {
        return webClient.post()
            .uri("/api/v1/analysis/process-camera/")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of("cameraId", camera.getId()))
            .retrieve()
            .bodyToMono(AiAnalysisResponse.class) // Change to AiAnalysisResponse.class
            .doOnSuccess(response -> {
                log.info("AI server response for camera [{}]: {}", camera.getName(), response);
                if (response.getTrainingStatus() != null) {
                    try {
                        TrainingStatus status = TrainingStatus.valueOf(response.getTrainingStatus());
                        cameraService.updateTrainingStatus(camera.getId(), status);
                    } catch (IllegalArgumentException e) {
                        log.warn("Unknown training status received for camera [{}]: {}", camera.getName(), response.getTrainingStatus());
                        cameraService.updateTrainingStatus(camera.getId(), TrainingStatus.UNKNOWN);
                    }
                }
            })
            .onErrorResume(WebClientResponseException.class, ex -> {
                log.error(
                    "AI server returned {} while processing camera [{}]. Body: {}",
                    ex.getStatusCode(),
                    camera.getName(),
                    ex.getResponseBodyAsString()
                );
                return Mono.empty();
            })
            .onErrorResume(WebClientRequestException.class, ex -> {
                log.error("Failed to reach AI server for camera [{}]: {}", camera.getName(), ex.getMessage());
                return Mono.empty();
            })
            .onErrorResume(ex -> {
                log.error("Unexpected error while requesting analysis for camera [{}]", camera.getName(), ex);
                return Mono.empty();
            })
            .then(); // Convert to Mono<Void> to signal completion
    }
}
