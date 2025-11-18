package com.github.jorepong.safetycctv.analysis.dto;

import com.github.jorepong.safetycctv.analysis.DensitySample;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record DensityPointPayload(
    String timestamp,
    Double density,
    Integer personCount
) {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static DensityPointPayload from(DensitySample sample) {
        if (sample == null) {
            return new DensityPointPayload(null, null, null);
        }
        return new DensityPointPayload(format(sample.timestamp()), sample.density(), sample.personCount());
    }

    private static String format(LocalDateTime timestamp) {
        return timestamp != null ? timestamp.format(FORMATTER) : null;
    }
}

