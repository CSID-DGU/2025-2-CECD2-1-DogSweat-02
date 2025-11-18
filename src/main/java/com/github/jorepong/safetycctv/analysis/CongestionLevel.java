package com.github.jorepong.safetycctv.analysis;

/**
 * Represents the qualitative level of congestion derived from normalized density values.
 */
public enum CongestionLevel {
    NO_DATA("데이터 없음", "neutral"),
    FREE("여유", "neutral"),
    CAUTION("주의", "warning"),
    DANGER("위험", "danger");

    private final String label;
    private final String tone;

    CongestionLevel(String label, String tone) {
        this.label = label;
        this.tone = tone;
    }

    public String label() {
        return label;
    }

    public String tone() {
        return tone;
    }
}

