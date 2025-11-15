package com.github.jorepong.safetycctv.alert;

import lombok.Getter;

/**
 * Defines the type of event that triggered a safety alert.
 * Based on the project documentation.
 */
@Getter
public enum AlertType {
    // Density related alerts
    CONGESTION_PREDICTED("혼잡도 임박"), // e.g., "8분 내 위험 수위 도달 예상"
    CONGESTION_ENTERED("혼잡도 진입"), // e.g., "위험 수위(0.60) 돌파"
    CONGESTION_ACCELERATED("혼잡도 심화"), // e.g., "밀집 상태에서 변화율/가속도 급증"
    CONGESTION_RESOLVED("혼잡도 해소"), // e.g., "위험 수위 아래로 감소 추세"

    // Behavior related alerts (from DeepSORT extension)
    ABNORMAL_BEHAVIOR_FALL("쓰러짐 감지"),
    ABNORMAL_BEHAVIOR_REVERSE("역주행 감지"),
    ABNORMAL_BEHAVIOR_BOTTLENECK("병목 현상 발생"),

    // Line crossing alerts (from mentor feedback)
    LINE_CROSSED_IN("라인 통과 (진입)"),
    LINE_CROSSED_OUT("라인 통과 (진출)"),

    // Other system alerts
    CAMERA_OFFLINE("카메라 오프라인"),
    SYSTEM_ERROR("시스템 오류");

    private final String displayName;

    AlertType(String displayName) {
        this.displayName = displayName;
    }
}
