package com.github.jorepong.safetycctv.camera;

public record CameraSummary(
    long total,
    long healthy,
    long warning,
    long offline
) {
}
