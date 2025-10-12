package com.github.jorepong.safetycctv.camera;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CameraForm {

    @NotBlank(message = "카메라 이름을 입력하세요.")
    @Size(max = 120, message = "카메라 이름은 120자 이하여야 합니다.")
    private String name;

    @NotBlank(message = "RTSP 주소를 입력하세요.")
    @Pattern(regexp = "^(rtsp)://.+$", message = "RTSP 주소는 rtsp:// 로 시작해야 합니다.")
    private String streamUrl;

    @Size(max = 120, message = "구역 이름은 120자 이하여야 합니다.")
    private String locationZone;

    @NotNull(message = "카메라 상태를 선택하세요.")
    private CameraStatus status = CameraStatus.HEALTHY;

    @Size(max = 255, message = "설명은 255자 이하여야 합니다.")
    private String description;

    @Size(max = 255, message = "주소는 255자 이하여야 합니다.")
    private String address;

    private Double latitude;

    private Double longitude;

    public Camera toEntity() {
        return Camera.builder()
            .name(name)
            .streamUrl(streamUrl)
            .locationZone(locationZone)
            .status(status)
            .description(description)
            .address(address)
            .latitude(latitude)
            .longitude(longitude)
            .build();
    }
}
