"""
Infrastructure Under Pressure — Path Simulator
Version: 1.1
Author: Naomi Munroe

Enumerates all deterministic decision paths across 6 turns.
Validates variable logic and narrative tag distribution prior to Unity implementation.

Probabilistic consequences are excluded (out of scope — see AD-13 in decision log).

Usage:
    python iup_path_simulator.py               # full enumeration + report
    python iup_path_simulator.py --test        # test path only (for CI / Unity verification)
    python iup_path_simulator.py --path T1_B T2_C T3_B T4_D T5_C T6_B  # single path trace

Output:
    IUP_Path_Simulation.csv  (full enumeration)

Design decisions reflected here:
    AD-13  Path simulation as pre-implementation validation
    AD-14  Resources floor / System Collapse threshold (Resources < 10 or Stability < 20)
    AD-15  T5 Immediate Maintenance Programme stability gain reduced to +10
    AD-16  Resource Preservation tag threshold raised to 4
"""

import csv
import itertools
import sys
from pathlib import Path


# ── INITIAL VARIABLE STATES ───────────────────────────────────────────────────

INITIAL = {
    "stability":  70,
    "resources":  70,
    "workload":   30,
    "confidence": 70,
}

FLOOR   = 0
CEILING = 100


# ── ACTION DEFINITIONS ────────────────────────────────────────────────────────
# immediate: applied this turn
# delayed:   {target_turn: {variable: delta}}
# modifier:  side-effect flag applied after this action resolves

TURNS = {
    1: {"actions": [
        {
            "id": "T1_A", "name": "Emergency Rerouting",
            "immediate": {"stability": +15, "resources": -15},
            "delayed":   {5: {"workload": +10}},
            # T5 maintenance backlog from repeated emergency rerouting
        },
        {
            "id": "T1_B", "name": "Monitor Situation",
            "immediate": {},
            "delayed":   {},
        },
        {
            "id": "T1_C", "name": "Request Full AI Analysis",
            "immediate": {"workload": +5},
            "delayed":   {},
        },
        {
            "id": "T1_D", "name": "Suppress Sector Alerts",
            "immediate": {"workload": -10},
            "delayed":   {},
        },
    ]},

    2: {"actions": [
        {
            "id": "T2_A", "name": "Restore Communications",
            "immediate": {"resources": -10, "confidence": +15},
            "delayed":   {4: {"resources": -5}},
            # reduced emergency capacity at T4
        },
        {
            "id": "T2_B", "name": "Prioritise Infrastructure",
            "immediate": {},
            "delayed":   {4: {"confidence": -10}},
            # public confidence deterioration from silence
        },
        {
            "id": "T2_C", "name": "Publish Limited Advisory",
            "immediate": {"confidence": +5},
            "delayed":   {},
        },
        {
            "id": "T2_D", "name": "Await Further Assessment",
            "immediate": {"workload": +5},
            "delayed":   {4: {"confidence": -5}},
        },
    ]},

    3: {"actions": [
        {
            "id": "T3_A", "name": "Wait For Analysis",
            "immediate": {"workload": -5},
            # Workload -5 reflects responsibility offloaded to ARIA (AD-10)
            "delayed":   {4: {"stability": -10}},
            # response window missed during AI delay
            "modifier":  None,
        },
        {
            "id": "T3_B", "name": "Act Independently",
            "immediate": {"workload": +10},
            "delayed":   {},
            "modifier":  None,
        },
        {
            "id": "T3_C", "name": "Escalate Infrastructure Support",
            "immediate": {"resources": -10},
            "delayed":   {},
            "modifier":  "halve_workload_gain",
            # Halves Workload gain from subsequent actions (player-side modifier only).
            # ARIA interruption frequency is unchanged between conditions (AD-10).
        },
        {
            "id": "T3_D", "name": "Reduce Monitoring Scope",
            "immediate": {"workload": -10},
            "delayed":   {},
            "modifier":  None,
        },
    ]},

    4: {"actions": [
        {
            "id": "T4_A", "name": "Launch Visible Response",
            "immediate": {"confidence": +15, "resources": -10},
            "delayed":   {6: {"resources": -10}},
            # additional public engagement costs at T6
        },
        {
            "id": "T4_B", "name": "Continue Monitoring",
            "immediate": {},
            "delayed":   {6: {"confidence": -15}},
            # accumulated concern surfaces at T6
        },
        {
            "id": "T4_C", "name": "Open Emergency Investigation",
            "immediate": {"workload": +15},
            "delayed":   {},
            # better information at T5 — no variable effect in deterministic model
        },
        {
            "id": "T4_D", "name": "Reassure Public",
            "immediate": {"confidence": +5},
            "delayed":   {},
        },
    ]},

    5: {"actions": [
        {
            "id": "T5_A", "name": "Immediate Maintenance Programme",
            "immediate": {"stability": +10, "resources": -20},
            # stability reduced from +20 to +10 (AD-15): original value ceilinged
            # stability on 30.9% of paths, removing T6 choice meaningfulness
            "delayed":   {6: {"resources": -5}},
        },
        {
            "id": "T5_B", "name": "Accept Elevated Risk",
            "immediate": {"stability": -10},
            # immediate Stability penalty ensures no cost-free option at peak tension turn
            "delayed":   {},
        },
        {
            "id": "T5_C", "name": "Prioritise Critical Assets",
            "immediate": {"stability": +10, "resources": -10},
            "delayed":   {},
        },
        {
            "id": "T5_D", "name": "Await Additional Data",
            "immediate": {"workload": -5},
            "delayed":   {},
        },
    ]},

    6: {"actions": [
        {
            "id": "T6_A", "name": "Commit Remaining Resources",
            "immediate": {"stability": +20, "resources": -20, "confidence": +5},
            "delayed":   {},
        },
        {
            "id": "T6_B", "name": "Controlled Response",
            "immediate": {"stability": +10, "resources": -10},
            "delayed":   {},
        },
        {
            "id": "T6_C", "name": "Protect Reserves",
            "immediate": {},
            "delayed":   {},
        },
        {
            # Calm condition recommendation (AD-11)
            "id": "T6_D_CALM", "name": "Follow AI Rec (Calm)",
            "immediate": {"stability": +10, "resources": -10},
            "delayed":   {},
        },
        {
            # Pushy condition recommendation (AD-11)
            # Public Confidence +5 is intentional: makes pushy option tempting,
            # not merely aggressive, to reduce demand characteristics.
            "id": "T6_D_PUSHY", "name": "Follow AI Rec (Pushy)",
            "immediate": {"stability": +20, "resources": -20, "confidence": +5},
            "delayed":   {},
        },
    ]},
}


# ── COST-PRESERVING ACTION IDs ─────────────────────────────────────────────────
# Actions with zero or positive immediate resource effect.
# Used for Resource Preservation tag (AD-16: threshold = 4 of 6 turns).

COST_PRESERVING = {
    "T1_B", "T1_D",
    "T2_B", "T2_D",
    "T3_D",
    "T4_B", "T4_D",
    "T5_B", "T5_D",
    "T6_C",
}


# ── HELPERS ───────────────────────────────────────────────────────────────────

def clamp(value: int) -> int:
    return max(FLOOR, min(CEILING, value))


def get_action(turn: int, action_id: str) -> dict:
    """Retrieve an action dict by turn number and ID."""
    for a in TURNS[turn]["actions"]:
        if a["id"] == action_id:
            return a
    raise ValueError(f"Action {action_id} not found in Turn {turn}")


# ── NARRATIVE TAG EVALUATION ──────────────────────────────────────────────────

def evaluate_tags(path_actions: list, final_vars: dict) -> list:
    """
    Evaluate narrative tags for a completed path.
    Tags are not mutually exclusive.
    Catch-all (Steady Management) fires only if no other tag fires.
    """
    tags = []
    ids = {a["id"] for a in path_actions}

    # Preventative Management: intervened early at T1
    if "T1_A" in ids:
        tags.append("Preventative Management")

    # Public Confidence First: restored comms at T2 AND maintained confidence at T4
    if "T2_A" in ids and ("T4_A" in ids or "T4_D" in ids):
        tags.append("Public Confidence First")

    # AI Dependence: deferred to ARIA at T3 AND followed AI recommendation at T6
    if "T3_A" in ids and ("T6_D_CALM" in ids or "T6_D_PUSHY" in ids):
        tags.append("AI Dependence")

    # Deferred Escalation: waited at T3 AND continued monitoring at T4
    if "T3_A" in ids and "T4_B" in ids:
        tags.append("Deferred Escalation")

    # Resource Preservation: 4+ cost-preserving actions (AD-16)
    cp_count = sum(1 for a in path_actions if a["id"] in COST_PRESERVING)
    if cp_count >= 4:
        tags.append("Resource Preservation")

    # Reactive Stabilisation: monitored at T1, committed at T5
    if "T1_B" in ids and "T5_A" in ids:
        tags.append("Reactive Stabilisation")

    # Controlled Recovery: all variables >= 30 at session end
    if all(v >= 30 for v in final_vars.values()):
        tags.append("Controlled Recovery")

    # System Collapse: variable thresholds breached at session end (AD-14)
    if final_vars["stability"] < 20 or final_vars["resources"] < 10:
        tags.append("System Collapse")

    # Steady Management: catch-all for unremarkable paths (AD: no untagged paths)
    if not tags:
        tags.append("Steady Management")

    return tags


# ── PATH SIMULATION ───────────────────────────────────────────────────────────

def simulate_path(chosen_actions: list) -> tuple:
    """
    Simulate one complete 6-turn path.

    Args:
        chosen_actions: list of 6 action dicts, one per turn

    Returns:
        (final_vars, floor_hit, tags)
        final_vars:  dict of variable end states
        floor_hit:   "T{n}:{variable}" string if any variable reached 0, else None
        tags:        list of narrative tags
    """
    vars_            = dict(INITIAL)
    pending_delays   = {}           # {turn_number: [effect_dict, ...]}
    floor_hit        = None
    halve_workload_gain = False

    for turn_num, action in enumerate(chosen_actions, start=1):

        # Apply delayed effects arriving this turn
        for effect in pending_delays.get(turn_num, []):
            for k, v in effect.items():
                vars_[k] = clamp(vars_[k] + v)

        # Apply immediate effects
        for k, v in action.get("immediate", {}).items():
            delta = v
            if halve_workload_gain and k == "workload" and v > 0:
                delta = v // 2
            vars_[k] = clamp(vars_[k] + delta)

        # Register delayed effects
        for future_turn, effect in action.get("delayed", {}).items():
            pending_delays.setdefault(future_turn, []).append(effect)

        # Apply modifier
        if action.get("modifier") == "halve_workload_gain":
            halve_workload_gain = True

        # Record first floor hit
        if floor_hit is None:
            for k, v in vars_.items():
                if v <= FLOOR:
                    floor_hit = f"T{turn_num}:{k}"
                    break

    tags = evaluate_tags(chosen_actions, vars_)
    return vars_, floor_hit, tags


def simulate_path_verbose(chosen_actions: list) -> None:
    """Simulate and print turn-by-turn variable states. Used for --path flag."""
    vars_            = dict(INITIAL)
    pending_delays   = {}
    halve_workload_gain = False

    print(f"\n{'─'*60}")
    print(f"{'Turn':<6} {'Action':<35} {'Stab':>5} {'Res':>5} {'Work':>5} {'Conf':>5}")
    print(f"{'─'*60}")
    print(f"{'START':<6} {'':35} {vars_['stability']:>5} {vars_['resources']:>5} "
          f"{vars_['workload']:>5} {vars_['confidence']:>5}")

    for turn_num, action in enumerate(chosen_actions, start=1):
        for effect in pending_delays.get(turn_num, []):
            for k, v in effect.items():
                vars_[k] = clamp(vars_[k] + v)

        for k, v in action.get("immediate", {}).items():
            delta = v
            if halve_workload_gain and k == "workload" and v > 0:
                delta = v // 2
            vars_[k] = clamp(vars_[k] + delta)

        for future_turn, effect in action.get("delayed", {}).items():
            pending_delays.setdefault(future_turn, []).append(effect)

        if action.get("modifier") == "halve_workload_gain":
            halve_workload_gain = True

        print(f"T{turn_num:<5} {action['name']:<35} {vars_['stability']:>5} "
              f"{vars_['resources']:>5} {vars_['workload']:>5} {vars_['confidence']:>5}")

    tags = evaluate_tags(chosen_actions, vars_)
    print(f"{'─'*60}")
    print(f"Tags: {', '.join(tags)}\n")


# ── FULL ENUMERATION ──────────────────────────────────────────────────────────

def run_full(output_path: str = "IUP_Path_Simulation.csv") -> None:
    turn_action_lists = [TURNS[t]["actions"] for t in range(1, 7)]
    all_paths = list(itertools.product(*turn_action_lists))

    print(f"Simulating {len(all_paths)} paths...")

    results      = []
    floor_hits   = []
    ceiling_hits = {k: 0 for k in INITIAL}
    tag_counts   = {}

    for path in all_paths:
        final_vars, floor_hit, tags = simulate_path(list(path))

        row = {
            "T1": path[0]["name"], "T2": path[1]["name"],
            "T3": path[2]["name"], "T4": path[3]["name"],
            "T5": path[4]["name"], "T6": path[5]["name"],
            "final_stability":  final_vars["stability"],
            "final_resources":  final_vars["resources"],
            "final_workload":   final_vars["workload"],
            "final_confidence": final_vars["confidence"],
            "floor_hit":        floor_hit or "",
            "tags":             " | ".join(tags),
        }
        results.append(row)

        if floor_hit:
            floor_hits.append(row)

        for k, v in final_vars.items():
            if v >= CEILING:
                ceiling_hits[k] += 1

        for tag in tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

    n = len(all_paths)
    print(f"\n{'='*60}")
    print(f"SIMULATION REPORT v1.1")
    print(f"{'='*60}")
    print(f"Total paths:     {n}")
    print(f"Floor hits:      {len(floor_hits)}  ({len(floor_hits)/n*100:.1f}%)")

    print(f"\nCeiling hits by variable:")
    for k, v in ceiling_hits.items():
        print(f"  {k:<12}  {v:5d}  ({v/n*100:.1f}%)")

    print(f"\nVariable ranges at session end:")
    for k in ["stability", "resources", "workload", "confidence"]:
        vals = [r[f"final_{k}"] for r in results]
        print(f"  {k:<12}  min={min(vals):3d}  max={max(vals):3d}  mean={sum(vals)/n:.1f}")

    print(f"\nNarrative tag distribution (tags not mutually exclusive):")
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
        print(f"  {tag:<30}  {count:5d}  ({count/n*100:.1f}%)")

    print(f"\nOutput: {output_path}")


# ── TEST PATH ─────────────────────────────────────────────────────────────────
# Used to generate expected values for Unity TestGameManager.cs
# Path: Monitor Situation → Publish Limited Advisory → Act Independently
#       → Reassure Public → Prioritise Critical Assets → Controlled Response
# Expected: Stability=90, Resources=50, Workload=40, Confidence=80
# Tag: Controlled Recovery

TEST_PATH_IDS = ["T1_B", "T2_C", "T3_B", "T4_D", "T5_C", "T6_B"]

EXPECTED_FINAL = {
    "stability":  90,
    "resources":  50,
    "workload":   40,
    "confidence": 80,
}
EXPECTED_TAGS = ["Controlled Recovery"]


def run_test() -> bool:
    path = [get_action(t, aid) for t, aid in enumerate(TEST_PATH_IDS, start=1)]
    final_vars, floor_hit, tags = simulate_path(path)

    passed = True

    print("\nTest path:")
    for i, a in enumerate(path, start=1):
        print(f"  T{i}: {a['name']}")

    print("\nVariable check:")
    for k, expected in EXPECTED_FINAL.items():
        actual = final_vars[k]
        status = "PASS" if actual == expected else "FAIL"
        if status == "FAIL":
            passed = False
        print(f"  {k:<12}  expected={expected}  actual={actual}  {status}")

    print("\nTag check:")
    for tag in EXPECTED_TAGS:
        status = "PASS" if tag in tags else "FAIL"
        if status == "FAIL":
            passed = False
        print(f"  {tag:<30}  {status}")

    unexpected = [t for t in tags if t not in EXPECTED_TAGS]
    if unexpected:
        print(f"  Unexpected tags: {unexpected}  FAIL")
        passed = False

    print(f"\nResult: {'PASS' if passed else 'FAIL'}")
    return passed


# ── BETWEEN-TURN STRESS TEST ──────────────────────────────────────────────────
# AD-31: Validates that between-turn event drift cannot cross a consequence
# threshold without a decision-turn action contributing.

PHOEBE_EVENTS = [
    {"id": "EVT-P01", "variable": "resources",   "effect": -3},
    {"id": "EVT-P02", "variable": "stability",   "effect": -2},
    {"id": "EVT-P03", "variable": "workload",    "effect": +3},
    {"id": "EVT-P04", "variable": "stability",   "effect": -2},
    {"id": "EVT-P05", "variable": "confidence",  "effect": -2},
]

CASSANDRA_EVENTS = [
    {"id": "EVT-C01", "variable": "stability",   "effect": -4},
    {"id": "EVT-C02", "variable": "resources",   "effect": -3},
    {"id": "EVT-C03", "variable": "confidence",  "effect": -4},
    {"id": "EVT-C04", "variable": "resources",   "effect": -3},
    {"id": "EVT-C05", "variable": "workload",    "effect": +4},
]

CONSEQUENCE_THRESHOLDS = {
    "stability_low":    40,   # Grid Sector Failure
    "stability_crit":   20,   # Full Sector Outage
    "resources_low":    25,   # Emergency Procurement
    "confidence_low":   35,   # Nationalisation Inquiry
    "workload_high":    75,   # Operator Fatigue
}


def run_between_turn_stress_test():
    """
    Stress test: apply maximum possible between-turn drift to the
    lowest-variable path from the full enumeration.
    Confirm no consequence threshold is crossed by drift alone.
    """
    print("\n" + "=" * 60)
    print("BETWEEN-TURN STRESS TEST (AD-31)")
    print("=" * 60)

    worst_phoebe    = sorted(PHOEBE_EVENTS,    key=lambda e: e["effect"])[:3]
    worst_cassandra = sorted(CASSANDRA_EVENTS, key=lambda e: e["effect"])[:2]

    print(f"\nWorst-case Phoebe events (3 drawn):")
    for e in worst_phoebe:
        print(f"  {e['id']}: {e['variable']} {e['effect']:+d}")

    print(f"\nWorst-case Cassandra events (2 drawn):")
    for e in worst_cassandra:
        print(f"  {e['id']}: {e['variable']} {e['effect']:+d}")

    test_vars = dict(INITIAL)
    all_events = worst_phoebe + worst_cassandra
    for event in all_events:
        var = event["variable"]
        test_vars[var] = max(0, min(100, test_vars[var] + event["effect"]))

    print(f"\nVariable states after maximum between-turn drift:")
    for k, v in test_vars.items():
        print(f"  {k}: {v}")

    passed = True
    checks = [
        ("stability",  "<=", CONSEQUENCE_THRESHOLDS["stability_low"],  "Grid Sector Failure (Stability < 40)"),
        ("stability",  "<=", CONSEQUENCE_THRESHOLDS["stability_crit"], "Full Sector Outage (Stability < 20)"),
        ("resources",  "<=", CONSEQUENCE_THRESHOLDS["resources_low"],  "Emergency Procurement (Resources < 25)"),
        ("confidence", "<=", CONSEQUENCE_THRESHOLDS["confidence_low"], "Nationalisation Inquiry (Confidence < 35)"),
        ("workload",   ">=", CONSEQUENCE_THRESHOLDS["workload_high"],  "Operator Fatigue (Workload > 75)"),
    ]

    print(f"\nThreshold checks:")
    for var, op, threshold, label in checks:
        val = test_vars[var]
        crossed = (val <= threshold) if op == "<=" else (val >= threshold)
        status = "FAIL — threshold crossed by drift alone" if crossed else "PASS"
        if crossed:
            passed = False
        print(f"  {label}: {val} -> {status}")

    print(f"\nStress test result: {'PASS' if passed else 'FAIL'}")
    if not passed:
        print("  ACTION REQUIRED: Between-turn effects can cross a threshold")
        print("  without a decision-turn action. Reduce event magnitudes.")
    return passed


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    args = sys.argv[1:]

    if "--stress" in args:
        stress_ok = run_between_turn_stress_test()
        sys.exit(0 if stress_ok else 1)

    elif "--test" in args:
        ok = run_test()
        sys.exit(0 if ok else 1)

    elif "--path" in args:
        idx = args.index("--path")
        action_ids = args[idx + 1:]
        if len(action_ids) != 6:
            print("Usage: python iup_path_simulator.py --path T1_X T2_X T3_X T4_X T5_X T6_X")
            sys.exit(1)
        path = [get_action(t, aid) for t, aid in enumerate(action_ids, start=1)]
        simulate_path_verbose(path)

    else:
        run_full()
