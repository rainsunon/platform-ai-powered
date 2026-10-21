package io.rydata.platform.financing.planning;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScenarioCatalog {

    public List<ScenarioResponse> all() {
        return List.of(
                new ScenarioResponse("conservative", "Conservative", "$12.40M", "$340.0k", "$1.20M", "16.8 Mos", 6, 45,
                        "M 0 135 C 140 130, 220 110, 350 96 C 480 84, 560 68, 700 52",
                        "M 0 135 C 140 130, 220 110, 350 96 C 480 84, 560 68, 700 52 L 700 140 L 0 140 Z"),
                new ScenarioResponse("baseline", "Baseline (Current)", "$14.28M", "$412.5k", "$1.85M", "14.6 Mos", 12, 85,
                        "M 0 130 C 140 120, 220 90, 350 78 C 480 66, 560 45, 700 28",
                        "M 0 130 C 140 120, 220 90, 350 78 C 480 66, 560 45, 700 28 L 700 140 L 0 140 Z"),
                new ScenarioResponse("growth", "Aggressive Growth", "$17.10M", "$585.0k", "$2.60M", "11.2 Mos", 24, 160,
                        "M 0 125 C 140 105, 220 70, 350 50 C 480 30, 560 18, 700 10",
                        "M 0 125 C 140 105, 220 70, 350 50 C 480 30, 560 18, 700 10 L 700 140 L 0 140 Z"));
    }
}
