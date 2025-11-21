package com.github.jorepong.safetycctv.camera;

public record CameraStatisticsPayload(
    Long cameraId,
    String cameraName,
    double peakDensity,
    double densityStdDev
) {

}
