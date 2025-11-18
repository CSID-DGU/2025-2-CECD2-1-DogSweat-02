package com.github.jorepong.safetycctv.alert;

import com.github.jorepong.safetycctv.alert.dto.AlertsPerHour;
import java.util.List;

public record AlertTrend(
    List<AlertsPerHour> points,
    long maxCount
) {
}
