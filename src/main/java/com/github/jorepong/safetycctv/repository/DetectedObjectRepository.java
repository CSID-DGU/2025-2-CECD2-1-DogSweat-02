package com.github.jorepong.safetycctv.repository;

import com.github.jorepong.safetycctv.entity.DetectedObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface DetectedObjectRepository extends JpaRepository<DetectedObject, Long> {

    long countByAnalysisLogCameraId(Long cameraId);

    @Modifying(clearAutomatically = true)
    @Transactional
    void deleteByAnalysisLogCameraId(Long cameraId);

    @Modifying(clearAutomatically = true)
    @Query(
        value = """
            DELETE FROM detected_objects
            WHERE analysis_log_id IN (SELECT id FROM analysis_logs WHERE camera_id = :cameraId)
              AND id NOT IN (
                  SELECT id FROM (
                      SELECT obj.id
                      FROM detected_objects obj
                      JOIN analysis_logs log ON log.id = obj.analysis_log_id
                      WHERE log.camera_id = :cameraId
                      ORDER BY log.timestamp DESC, obj.id DESC
                      LIMIT :maxPoints
                  ) AS latest
              )
            """,
        nativeQuery = true
    )
    int deleteOlderThanLimit(
        @Param("cameraId") Long cameraId,
        @Param("maxPoints") int maxPoints
    );
}
