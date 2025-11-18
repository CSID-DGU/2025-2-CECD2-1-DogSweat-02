package com.github.jorepong.safetycctv.entity;

import com.github.jorepong.safetycctv.camera.CameraStatus;
import com.github.jorepong.safetycctv.camera.StreamType;
import com.github.jorepong.safetycctv.camera.TrainingStatus; // Import new enum
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cameras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Camera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false)
    private String streamUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private StreamType streamType = StreamType.RTSP;

    @Column(length = 120)
    private String locationZone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CameraStatus status;

    @Column(length = 255)
    private String description;

    @Column(length = 255)
    private String address;

    private Double latitude;

    private Double longitude;

    @Column(name = "training_ready_at")
    private LocalDateTime trainingReadyAt;

    // New field for training status
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TrainingStatus trainingStatus = TrainingStatus.UNKNOWN; // Initialize with UNKNOWN

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        final LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = CameraStatus.HEALTHY;
        }
        // No need to check streamType here if @Builder.Default is used
        // No need to check trainingStatus here if @Builder.Default is used
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
