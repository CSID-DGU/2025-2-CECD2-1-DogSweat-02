package com.github.jorepong.safetycctv.analysis.dto;

import java.time.DayOfWeek;

public record CongestionHeatmapPoint(
    DayOfWeek dayOfWeek,
    int hour,
    double avgDensity,
    double stdDev
) {
}
