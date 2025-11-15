package com.github.jorepong.safetycctv.alert;

import lombok.Getter;

/**
 * Defines the severity level of a safety alert.
 */
@Getter
public enum AlertLevel {
    INFO("정보"),
    LOW("낮음"),
    MEDIUM("중간"),
    HIGH("높음"),
    CRITICAL("심각");

    private final String displayName;

    AlertLevel(String displayName) {
        this.displayName = displayName;
    }
}
