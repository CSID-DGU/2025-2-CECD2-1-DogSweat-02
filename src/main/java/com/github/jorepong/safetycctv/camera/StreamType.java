package com.github.jorepong.safetycctv.camera;

public enum StreamType {
    RTSP("RTSP 스트림"),
    YOUTUBE("YouTube Live");

    private final String displayName;

    StreamType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
