package com.github.jorepong.safetycctv.alert;

import com.github.jorepong.safetycctv.analysis.StageSeverity;
import java.time.LocalDateTime;

/**
 * Represents a recent alert event enriched with the camera metadata that produced it.
 */
public record RecentAlertView(
    Long cameraId,
    String cameraName,
    String cameraLocation,
    String title,
    String message,
    StageSeverity severity,
    LocalDateTime timestamp
) {

    public String severitySuffix() {
        return severity != null ? severity.cssSuffix() : StageSeverity.INFO.cssSuffix();
    }
}

