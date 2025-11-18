package com.github.jorepong.safetycctv.entity;

public enum AnalysisStatus {
    READY,   // Perspective map exists and is being used.
    PENDING  // Perspective map is not yet trained, using a uniform map.
}
