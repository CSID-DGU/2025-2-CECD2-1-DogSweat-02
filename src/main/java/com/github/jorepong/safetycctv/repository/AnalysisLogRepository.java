package com.github.jorepong.safetycctv.repository;

import com.github.jorepong.safetycctv.camera.TrainingStatus;
import com.github.jorepong.safetycctv.entity.AnalysisLog;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface AnalysisLogRepository extends JpaRepository<AnalysisLog, Long> {

    /**
     * Finds the most recent analysis log for a given camera ID.
     *
     * @param cameraId The ID of the camera.
     * @return an Optional containing the most recent AnalysisLog, or an empty Optional if none found.
     */
    Optional<AnalysisLog> findFirstByCameraIdOrderByTimestampDesc(Long cameraId);

    /**
     * Returns the latest analysis logs (up to 60 entries) for the given camera.
     *
     * @param cameraId camera identifier
     * @return ordered list (newest first) limited to at most 60 rows
     */
    List<AnalysisLog> findTop60ByCameraIdOrderByTimestampDesc(Long cameraId);

    List<AnalysisLog> findTop60ByCameraIdAndTimestampGreaterThanEqualOrderByTimestampDesc(
        Long cameraId,
        LocalDateTime timestamp
    );

    List<AnalysisLog> findByCameraIdAndTimestampGreaterThanEqualOrderByTimestampDesc(Long cameraId, LocalDateTime timestamp);

    @Modifying(clearAutomatically = true)
    @Transactional
    void deleteByCameraId(Long cameraId);

    /**
     * Counts valid analysis logs produced after the provided timestamp while excluding
     * cameras in a specific training status and any logs created before the camera's
     * trainingReadyAt cutoff.
     */
    @Query("""
        SELECT COUNT(al)
        FROM AnalysisLog al
        WHERE al.timestamp >= :timestamp
          AND (:excludedStatus IS NULL OR al.camera.trainingStatus <> :excludedStatus)
          AND (al.camera.trainingReadyAt IS NULL OR al.timestamp >= al.camera.trainingReadyAt)
        """)
    long countValidLogsSince(
        @Param("timestamp") LocalDateTime timestamp,
        @Param("excludedStatus") TrainingStatus excludedStatus
    );
}
