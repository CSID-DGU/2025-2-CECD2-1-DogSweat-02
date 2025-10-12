package com.github.jorepong.safetycctv.camera;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import(CameraService.class)
class CameraServiceTest {

    @Autowired
    private CameraService cameraService;

    @Autowired
    private CameraRepository cameraRepository;

    @Test
    @DisplayName("카메라를 등록하면 요약 정보에 반영된다")
    void createCameraUpdatesSummary() {
        CameraForm form = new CameraForm();
        form.setName("본관 로비 1번");
        form.setStreamUrl("rtsp://example.com/stream1");
        form.setLocationZone("본관");
        form.setStatus(CameraStatus.HEALTHY);

        cameraService.create(form);

        CameraSummary summary = cameraService.summarize();
        assertThat(summary.total()).isEqualTo(1);
        assertThat(summary.healthy()).isEqualTo(1);
        assertThat(summary.warning()).isZero();
        assertThat(summary.offline()).isZero();

        assertThat(cameraRepository.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("카메라를 삭제하면 목록과 요약 정보가 줄어든다")
    void deleteCameraRemovesEntity() {
        CameraForm form1 = new CameraForm();
        form1.setName("본관 로비 1번");
        form1.setStreamUrl("rtsp://example.com/stream1");
        form1.setStatus(CameraStatus.HEALTHY);
        Long id1 = cameraService.create(form1).getId();

        CameraForm form2 = new CameraForm();
        form2.setName("지하주차장 2번");
        form2.setStreamUrl("rtsp://example.com/stream2");
        form2.setStatus(CameraStatus.WARNING);
        Long id2 = cameraService.create(form2).getId();

        cameraService.delete(id1);

        assertThat(cameraRepository.existsById(id1)).isFalse();
        assertThat(cameraRepository.existsById(id2)).isTrue();

        CameraSummary summary = cameraService.summarize();
        assertThat(summary.total()).isEqualTo(1);
        assertThat(summary.healthy()).isZero();
        assertThat(summary.warning()).isEqualTo(1);
    }
}
