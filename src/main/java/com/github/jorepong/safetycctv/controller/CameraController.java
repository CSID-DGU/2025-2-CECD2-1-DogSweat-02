package com.github.jorepong.safetycctv.controller;

import com.github.jorepong.safetycctv.camera.CameraForm;
import com.github.jorepong.safetycctv.camera.CameraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class CameraController {

    private final CameraService cameraService;

    @Value("${naver.map.client-id:}")
    private String naverMapClientId;

    @GetMapping("/cameras")
    public String cameras(@ModelAttribute("cameraForm") CameraForm cameraForm, Model model) {
        populateCameraModel(model);
        return "cameras";
    }

    @PostMapping("/cameras")
    public String createCamera(
        @Valid @ModelAttribute("cameraForm") CameraForm cameraForm,
        BindingResult bindingResult,
        Model model,
        RedirectAttributes redirectAttributes
    ) {
        if (!cameraForm.isStreamUrlValidForType()) {
            bindingResult.rejectValue(
                "streamUrl",
                "camera.streamUrl.invalid",
                cameraForm.streamUrlRuleMessage()
            );
        }

        if (bindingResult.hasErrors()) {
            populateCameraModel(model);
            return "cameras";
        }

        cameraService.create(cameraForm);
        redirectAttributes.addFlashAttribute("toastMessage", "카메라가 추가되었습니다.");
        return "redirect:/cameras";
    }

    @PostMapping("/cameras/{cameraId}/delete")
    public String deleteCamera(
        @PathVariable Long cameraId,
        RedirectAttributes redirectAttributes
    ) {
        cameraService.delete(cameraId);
        redirectAttributes.addFlashAttribute("toastMessage", "카메라가 삭제되었습니다.");
        return "redirect:/cameras";
    }

    private void populateCameraModel(Model model) {
        model.addAttribute("cameras", cameraService.fetchAll());
        model.addAttribute("summary", cameraService.summarize());
        model.addAttribute("naverMapClientId", naverMapClientId);
    }
}
