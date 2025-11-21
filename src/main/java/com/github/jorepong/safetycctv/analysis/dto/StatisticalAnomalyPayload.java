package com.github.jorepong.safetycctv.analysis.dto;

public record StatisticalAnomalyPayload(
    boolean isAnalyzable,
    String message,
    Double currentDensity,
    Double averageDensity,
    Double stdDeviation,
    Double zScore
) {
    public static StatisticalAnomalyPayload notAnalyzable(String message, Double currentDensity) {
        return new StatisticalAnomalyPayload(false, message, currentDensity, null, null, null);
    }
}
