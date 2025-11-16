package com.github.jorepong.safetycctv.capture.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResponse {
    private String status;
    private Long cameraId;
    private String cameraName;
    private Integer personCount;
    private Double density;
    private String rawImagePath;
    private String annotatedImagePath;
    private String trainingStatus; // New field
    private String message;
}
