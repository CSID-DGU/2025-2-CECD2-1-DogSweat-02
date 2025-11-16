package com.github.jorepong.safetycctv.capture.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class PerspectiveMapTrainingResponse {
    private String status;
    private List<TrainedCameraInfo> trainedCameras;
    private List<SkippedCameraInfo> skippedCameras;
    private String message;
}
