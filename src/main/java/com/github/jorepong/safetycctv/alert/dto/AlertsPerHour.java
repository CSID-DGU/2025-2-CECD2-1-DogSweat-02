package com.github.jorepong.safetycctv.alert.dto;

public record AlertsPerHour(
    Integer hour,
    Long count
) {
}
