package com.github.jorepong.safetycctv.capture.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class SkippedCameraInfo {
    private Long cameraId;
    private String reason;
    private Integer samplesAvailable;
}
