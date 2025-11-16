package com.github.jorepong.safetycctv.alert.dto;

import com.github.jorepong.safetycctv.alert.RecentAlertView;
import com.github.jorepong.safetycctv.analysis.StageSeverity;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record RecentAlertPayload(
    Long cameraId,
    String cameraName,
    String cameraLocation,
    String title,
    String message,
    String severity,
    String timestamp
) {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static RecentAlertPayload from(RecentAlertView view) {
        if (view == null) {
            return new RecentAlertPayload(null, null, null, null, null, StageSeverity.INFO.name().toLowerCase(), null);
        }
        return new RecentAlertPayload(
            view.cameraId(),
            view.cameraName(),
            view.cameraLocation(),
            view.title(),
            view.message(),
            (view.severity() != null ? view.severity() : StageSeverity.INFO).name().toLowerCase(),
            format(view.timestamp())
        );
    }

    private static String format(LocalDateTime value) {
        return value != null ? value.format(FORMATTER) : null;
    }
}

