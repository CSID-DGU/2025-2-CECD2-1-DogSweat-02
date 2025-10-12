package com.github.jorepong.safetycctv.camera;

/**
 * Operational state of a camera as displayed in the management UI.
 */
public enum CameraStatus {
    HEALTHY("정상"),
    WARNING("주의"),
    OFFLINE("오프라인");

    private final String displayName;

    CameraStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
