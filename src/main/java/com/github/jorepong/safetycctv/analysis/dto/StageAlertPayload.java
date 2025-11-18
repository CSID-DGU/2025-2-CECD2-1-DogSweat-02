package com.github.jorepong.safetycctv.analysis.dto;

import com.github.jorepong.safetycctv.analysis.StageAlertView;
import com.github.jorepong.safetycctv.analysis.StageSeverity;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record StageAlertPayload(
    String code,
    String title,
    String message,
    String severity,
    String timestamp
) {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static StageAlertPayload from(StageAlertView view) {
        if (view == null) {
            return new StageAlertPayload(null, null, null, StageSeverity.INFO.name().toLowerCase(), null);
        }
        return new StageAlertPayload(
            view.code(),
            view.title(),
            view.message(),
            view.severity().name().toLowerCase(),
            format(view.timestamp())
        );
    }

    private static String format(LocalDateTime timestamp) {
        return timestamp != null ? timestamp.format(FORMATTER) : null;
    }
}
