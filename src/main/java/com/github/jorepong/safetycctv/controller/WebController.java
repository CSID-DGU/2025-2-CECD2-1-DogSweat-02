package com.github.jorepong.safetycctv.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class WebController {

    @GetMapping("/")
    public String dashboard() {
        return "dashboard";
    }

    @GetMapping("/analysis")
    public String analysisPage() {
        return "analysis";
    }

    @GetMapping("/map")
    public String mapPage() {
        return "map";
    }

    @GetMapping("/alerts")
    public String alertsPage() {
        return "alerts";
    }
}
