package com.github.jorepong.safetycctv.dashboard;

import com.github.jorepong.safetycctv.entity.Camera;
import com.github.jorepong.safetycctv.camera.StreamType;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.regex.Pattern;

public record DashboardCameraView(
    Long id,
    String name,
    String location,
    String description,
    String embedUrl,
    String streamUrl
) {

    private static final Pattern VIDEO_ID_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{11}$");

    public static Optional<DashboardCameraView> from(Camera camera) {
        if (camera == null || camera.getStreamType() != StreamType.YOUTUBE) {
            return Optional.empty();
        }

        final String embedUrl = buildEmbedUrl(camera.getStreamUrl());
        if (embedUrl == null) {
            return Optional.empty();
        }

        String location = camera.getAddress() != null && !camera.getAddress().isBlank()
            ? camera.getAddress()
            : camera.getLocationZone();

        return Optional.of(new DashboardCameraView(
            camera.getId(),
            camera.getName(),
            location,
            camera.getDescription(),
            embedUrl,
            camera.getStreamUrl()
        ));
    }

    private static String buildEmbedUrl(String rawUrl) {
        final String videoId = extractVideoId(rawUrl);
        if (videoId == null) {
            return null;
        }
        return "https://www.youtube.com/embed/" + videoId
            + "?autoplay=1&mute=1&playsinline=1&rel=0&controls=0&modestbranding=1&iv_load_policy=3&showinfo=0";
    }

    private static String extractVideoId(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }

        final String trimmed = rawUrl.trim();
        try {
            final URI uri = URI.create(trimmed);
            final String host = Optional.ofNullable(uri.getHost())
                .map(String::toLowerCase)
                .orElse("");

            if (host.contains("youtu.be")) {
                final String path = Optional.ofNullable(uri.getPath()).orElse("");
                if (path.length() > 1) {
                    return sanitizeVideoId(path.substring(1));
                }
            }

            if (host.contains("youtube.com")) {
                final String path = Optional.ofNullable(uri.getPath()).orElse("");
                if (path.startsWith("/watch")) {
                    final String queryId = extractQueryParam(uri, "v");
                    if (queryId != null) {
                        return sanitizeVideoId(queryId);
                    }
                }

                for (String prefix : new String[]{"/live/", "/embed/", "/shorts/"}) {
                    if (path.startsWith(prefix)) {
                        final String[] segments = path.split("/");
                        final String candidate = segments[segments.length - 1];
                        return sanitizeVideoId(candidate);
                    }
                }
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return null;
    }

    private static String extractQueryParam(URI uri, String key) {
        final String query = uri.getRawQuery();
        if (query == null || query.isBlank()) {
            return null;
        }
        final String needle = key + "=";
        for (String part : query.split("&")) {
            if (part.startsWith(needle)) {
                return URLDecoder.decode(part.substring(needle.length()), StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    private static String sanitizeVideoId(String candidate) {
        if (candidate == null) {
            return null;
        }
        final String trimmed = candidate.trim();
        return VIDEO_ID_PATTERN.matcher(trimmed).matches() ? trimmed : null;
    }
}
