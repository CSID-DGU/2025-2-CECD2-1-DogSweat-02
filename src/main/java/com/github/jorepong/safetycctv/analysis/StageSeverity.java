package com.github.jorepong.safetycctv.analysis;

/**
 * Simplified severity levels for generated alerts.
 */
public enum StageSeverity {
    INFO("low"),
    WARNING("medium"),
    DANGER("high");

    private final String cssSuffix;

    StageSeverity(String cssSuffix) {
        this.cssSuffix = cssSuffix;
    }

    public String cssSuffix() {
        return cssSuffix;
    }
}

