package com.github.jorepong.safetycctv.capture.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class TrainedCameraInfo {
    private Long cameraId;
    private String cameraName;
    private Integer samplesUsed;
    private String trainingTime;
}
