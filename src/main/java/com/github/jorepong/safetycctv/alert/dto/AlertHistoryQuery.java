package com.github.jorepong.safetycctv.alert.dto;

import com.github.jorepong.safetycctv.analysis.StageSeverity;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Objects;
import org.springframework.data.domain.Sort;

public record AlertHistoryQuery(
    int page,
    int size,
    Sort sort,
    StageSeverity severity,
    Long cameraId,
    String search,
    LocalDateTime start,
    LocalDateTime end
) {

    public static AlertHistoryQuery of(
        Integer page,
        Integer size,
        String sortParam,
        String level,
        Long cameraId,
        String search,
        String start,
        String end
    ) {
        int resolvedPage = page != null && page >= 0 ? page : 0;
        int resolvedSize = size != null && size > 0 ? Math.min(size, 100) : 15;
        Sort sort = resolveSort(sortParam);
        StageSeverity parsedSeverity = parseSeverity(level);
        LocalDateTime startTime = parseDateTime(start);
        LocalDateTime endTime = parseDateTime(end);

        return new AlertHistoryQuery(
            resolvedPage,
            resolvedSize,
            sort,
            parsedSeverity,
            cameraId,
            search != null ? search.trim() : null,
            startTime,
            endTime
        );
    }

    public Sort.Order sortOrder() {
        return sort.stream().findFirst().orElse(Sort.Order.desc("timestamp"));
    }

    private static Sort resolveSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "timestamp");
        }
        String[] parts = sortParam.split(",", 2);
        String property = parts[0].trim();
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;
        return switch (property) {
            case "cameraName" -> Sort.by(direction, "cameraName");
            case "level" -> Sort.by(direction, "severity");
            default -> Sort.by(direction, "timestamp");
        };
    }

    private static StageSeverity parseSeverity(String value) {
        if (value == null || value.isBlank() || Objects.equals(value, "all")) {
            return null;
        }
        try {
            return StageSeverity.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.ofInstant(Instant.parse(value), ZoneId.systemDefault());
        } catch (Exception ignored) {
        }
        return null;
    }
}
