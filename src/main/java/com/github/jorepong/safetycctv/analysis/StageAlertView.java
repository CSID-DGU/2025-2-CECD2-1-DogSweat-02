package com.github.jorepong.safetycctv.analysis;

import java.time.LocalDateTime;

public record StageAlertView(
    String code,
    String title,
    String message,
    StageSeverity severity,
    LocalDateTime timestamp
) {
}

