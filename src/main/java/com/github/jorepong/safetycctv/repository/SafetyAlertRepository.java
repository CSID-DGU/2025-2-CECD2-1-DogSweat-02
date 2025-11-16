package com.github.jorepong.safetycctv.repository;

import com.github.jorepong.safetycctv.entity.SafetyAlert;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface SafetyAlertRepository extends JpaRepository<SafetyAlert, Long>, JpaSpecificationExecutor<SafetyAlert> {

    @Query("""
        SELECT FUNCTION('HOUR', s.timestamp), COUNT(s)
        FROM SafetyAlert s
        WHERE s.timestamp >= :startTime
          AND (
            s.camera.trainingStatus IS NULL
            OR s.camera.trainingStatus <> com.github.jorepong.safetycctv.camera.TrainingStatus.PENDING
        )
          AND (
            s.camera.trainingReadyAt IS NULL
            OR s.timestamp >= s.camera.trainingReadyAt
        )
        GROUP BY FUNCTION('HOUR', s.timestamp)
        ORDER BY FUNCTION('HOUR', s.timestamp) ASC
        """)
    List<Object[]> findAlertsPerHourSince(@Param("startTime") Instant startTime);

    @Modifying(clearAutomatically = true)
    @Transactional
    void deleteByCameraId(Long cameraId);
}
