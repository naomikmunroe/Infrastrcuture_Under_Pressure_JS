using System.Collections.Generic;
using UnityEngine;

// Drives a known 6-turn path through GameManager and verifies final variable state.
//
// Primary test path: T1_B -> T2_C -> T3_B -> T4_D -> T5_C -> T6_B
//   Monitor Situation -> Publish Limited Advisory -> Act Independently
//   -> Reassure Public -> Prioritise Critical Assets -> Controlled Response
// Expected: Stability=90, Resources=50, Workload=40, Confidence=80
// Source: iup_path_simulator_1.py TEST_PATH_IDS (verified with --test flag)
//
// Note: PHASE1.md lists a different test path (T1_A/T2_A/T3_B/T4_A/T5_C/T6_B)
// with expected values (85/10/45/80) that do not match the v1.1 simulator output.
// The simulator produces Stability=100, Resources=0, Workload=50, Confidence=100
// for that path. Use the simulator as authoritative.
//
// Turn flow: AdvanceTurn() is called at the START of each turn to process any
// delayed effects due that turn, then the action's immediate effects are applied.
// A final AdvanceTurn() after T6's action advances past MaxTurns and fires OnGameOver.

public class TestGameManager : MonoBehaviour
{
    private int _passed;
    private int _failed;

    private void Start()
    {
        RunPrimaryPath();
        RunDelayedEffectsPath();
        Debug.Log($"[TestGameManager] Total: {_passed} passed, {_failed} failed.");
    }

    // Python-verified path — no delayed effects, cleanest assertion target.
    private void RunPrimaryPath()
    {
        Debug.Log("[TestGameManager] === Primary path (T1_B -> T2_C -> T3_B -> T4_D -> T5_C -> T6_B) ===");
        var gm = GameManager.Instance;
        gm.ResetSession();

        Act(gm, "T1_B Monitor Situation",          new Dictionary<string, int>());
        Act(gm, "T2_C Publish Limited Advisory",   new Dictionary<string, int> { { "confidence", 5 } });
        Act(gm, "T3_B Act Independently",          new Dictionary<string, int> { { "workload", 10 } });
        Act(gm, "T4_D Reassure Public",            new Dictionary<string, int> { { "confidence", 5 } });
        Act(gm, "T5_C Prioritise Critical Assets", new Dictionary<string, int> { { "stability", 10 }, { "resources", -10 } });
        Act(gm, "T6_B Controlled Response",        new Dictionary<string, int> { { "stability", 10 }, { "resources", -10 } });

        gm.AdvanceTurn(); // CurrentTurn -> 7 -> GameOver

        Assert("Stability",  gm.Stability,  90);
        Assert("Resources",  gm.Resources,  50);
        Assert("Workload",   gm.Workload,   40);
        Assert("Confidence", gm.Confidence, 80);
        Assert("IsCollapsed", gm.IsSystemCollapsed() ? 1 : 0, 0);
    }

    // Exercises RegisterDelayedEffect and ProcessDelayedEffects using the PHASE1.md
    // action path with correct expected values from the v1.1 simulator.
    // Path: T1_A -> T2_A -> T3_B -> T4_A -> T5_C -> T6_B
    // Correct final: Stability=100, Resources=0, Workload=50, Confidence=100
    private void RunDelayedEffectsPath()
    {
        Debug.Log("[TestGameManager] === Delayed effects path (T1_A -> T2_A -> T3_B -> T4_A -> T5_C -> T6_B) ===");
        var gm = GameManager.Instance;
        gm.ResetSession();

        // T1_A: Emergency Rerouting — stability+15, resources-15; delayed T5 workload+10
        gm.AdvanceTurn();
        gm.RegisterDelayedEffect(5, new Dictionary<string, int> { { "workload", 10 } });
        gm.ApplyEffect(new Dictionary<string, int> { { "stability", 15 }, { "resources", -15 } });
        LogState(gm, "T1_A Emergency Rerouting");

        // T2_A: Restore Communications — resources-10, confidence+15; delayed T4 resources-5
        gm.AdvanceTurn();
        gm.RegisterDelayedEffect(4, new Dictionary<string, int> { { "resources", -5 } });
        gm.ApplyEffect(new Dictionary<string, int> { { "resources", -10 }, { "confidence", 15 } });
        LogState(gm, "T2_A Restore Communications");

        // T3_B: Act Independently — workload+10
        gm.AdvanceTurn();
        gm.ApplyEffect(new Dictionary<string, int> { { "workload", 10 } });
        LogState(gm, "T3_B Act Independently");

        // T4_A: Launch Visible Response — (T4 delayed resources-5 applied by AdvanceTurn above)
        //        immediate: confidence+15, resources-10; delayed T6 resources-10
        gm.AdvanceTurn();
        gm.RegisterDelayedEffect(6, new Dictionary<string, int> { { "resources", -10 } });
        gm.ApplyEffect(new Dictionary<string, int> { { "confidence", 15 }, { "resources", -10 } });
        LogState(gm, "T4_A Launch Visible Response");

        // T5_C: Prioritise Critical Assets — (T5 delayed workload+10 applied by AdvanceTurn above)
        //        immediate: stability+10, resources-10
        gm.AdvanceTurn();
        gm.ApplyEffect(new Dictionary<string, int> { { "stability", 10 }, { "resources", -10 } });
        LogState(gm, "T5_C Prioritise Critical Assets");

        // T6_B: Controlled Response — (T6 delayed resources-10 applied by AdvanceTurn above)
        //        immediate: stability+10, resources-10
        gm.AdvanceTurn();
        gm.ApplyEffect(new Dictionary<string, int> { { "stability", 10 }, { "resources", -10 } });
        LogState(gm, "T6_B Controlled Response");

        gm.AdvanceTurn(); // -> GameOver

        Assert("Stability",   gm.Stability,  100);
        Assert("Resources",   gm.Resources,  0);
        Assert("Workload",    gm.Workload,   50);
        Assert("Confidence",  gm.Confidence, 100);
        Assert("IsCollapsed", gm.IsSystemCollapsed() ? 1 : 0, 1);
    }

    private void Act(GameManager gm, string label, Dictionary<string, int> effects)
    {
        gm.AdvanceTurn();
        gm.ApplyEffect(effects);
        LogState(gm, label);
    }

    private void LogState(GameManager gm, string label)
    {
        Debug.Log($"  T{gm.CurrentTurn} {label} | " +
                  $"Stability={gm.Stability} Resources={gm.Resources} " +
                  $"Workload={gm.Workload} Confidence={gm.Confidence}");
    }

    private void Assert(string label, int actual, int expected)
    {
        bool pass = actual == expected;
        if (pass) _passed++;
        else      _failed++;
        Debug.Log($"  {label}: expected={expected} actual={actual} {(pass ? "PASS" : "FAIL")}");
    }
}
