package com.github.jorepong.safetycctv.dashboard;

import com.github.jorepong.safetycctv.analysis.CongestionLevel;
import com.github.jorepong.safetycctv.camera.TrainingStatus;

public record DashboardSidebarCamera(
    Long id,
    String name,
    String location,
    CongestionLevel level,
    TrainingStatus trainingStatus
) {

}
