package com.github.jorepong.safetycctv.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Represents a single object (e.g., a person) detected within an analysis snapshot.
 */
@Entity
@Table(name = "detected_objects")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetectedObject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The analysis log this object belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_log_id")
    private AnalysisLog analysisLog;

    /**
     * A unique ID assigned by the tracking algorithm (e.g., DeepSORT) to maintain identity across frames.
     */
    private Long trackingId;

    /**
     * The coordinates of the bounding box (left, top).
     */
    @Column(nullable = false)
    private Integer boxX;

    @Column(nullable = false)
    private Integer boxY;

    /**
     * The dimensions of the bounding box.
     */
    @Column(nullable = false)
    private Integer boxWidth;

    @Column(nullable = false)
    private Integer boxHeight;

    /**
     * The confidence score of the detection model for this object.
     */
    private Double confidence;
}
