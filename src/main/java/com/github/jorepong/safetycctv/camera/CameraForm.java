package com.github.jorepong.safetycctv.camera;

import com.github.jorepong.safetycctv.entity.Camera;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.regex.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CameraForm {

    private static final Pattern RTSP_PATTERN = Pattern.compile("^rtsp://.+", Pattern.CASE_INSENSITIVE);
    private static final Pattern YOUTUBE_PATTERN =
        Pattern.compile("^(https?://)?([a-z0-9-]+\\.)*(youtube\\.com|youtu\\.be)/.+$", Pattern.CASE_INSENSITIVE);

    @NotBlank(message = "카메라 이름을 입력하세요.")
    @Size(max = 120, message = "카메라 이름은 120자 이하로 입력하세요.")
    private String name;

    @NotNull(message = "스트리밍 유형을 선택하세요.")
    private StreamType streamType = StreamType.RTSP;

    @NotBlank(message = "스트리밍 주소를 입력하세요.")
    private String streamUrl;

    @Size(max = 120, message = "구역 이름은 120자 이하로 입력하세요.")
    private String locationZone;

    @NotNull(message = "카메라 상태를 선택하세요.")
    private CameraStatus status = CameraStatus.HEALTHY;

    @Size(max = 255, message = "설명은 255자 이하로 입력하세요.")
    private String description;

    @Size(max = 255, message = "주소는 255자 이하로 입력하세요.")
    private String address;

    private Double latitude;

    private Double longitude;

    public boolean isStreamUrlValidForType() {
        if (streamType == null || streamUrl == null || streamUrl.isBlank()) {
            return true;
        }
        final String trimmedUrl = streamUrl.trim();
        return switch (streamType) {
            case RTSP -> RTSP_PATTERN.matcher(trimmedUrl).matches();
            case YOUTUBE -> YOUTUBE_PATTERN.matcher(trimmedUrl).matches();
        };
    }

    public String streamUrlRuleMessage() {
        if (streamType == StreamType.YOUTUBE) {
            return "YouTube Live 주소 전체(URL)를 입력하세요.";
        }
        return "RTSP 주소는 rtsp://로 시작해야 합니다.";
    }

    public Camera toEntity() {
        return Camera.builder()
            .name(name)
            .streamUrl(streamUrl != null ? streamUrl.trim() : null)
            .streamType(streamType)
            .locationZone(locationZone)
            .status(status)
            .description(description)
            .address(address)
            .latitude(latitude)
            .longitude(longitude)
            .build();
    }
}
