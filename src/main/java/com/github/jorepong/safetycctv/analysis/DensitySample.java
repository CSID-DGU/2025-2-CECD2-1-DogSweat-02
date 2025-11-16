package com.github.jorepong.safetycctv.analysis;

import java.time.LocalDateTime;

public record DensitySample(
    LocalDateTime timestamp,
    double density,
    Integer personCount
) {
}

