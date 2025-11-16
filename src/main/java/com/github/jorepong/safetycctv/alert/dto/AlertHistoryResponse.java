package com.github.jorepong.safetycctv.alert.dto;

import java.util.List;

public record AlertHistoryResponse(
    List<AlertHistoryPayload> content,
    long totalElements,
    int totalPages,
    int page,
    int size
) {
}

