/**
 * data.js — Turn definitions, further analysis content, AI text.
 * All game content lives here. No logic.
 *
 * Structure per turn:
 *   id, title, phase, incident,
 *   reports: [{label, source, bullets}],
 *   furtherAnalysis: {expandedReport, confidence, consequence, text},
 *   aria: {calm, pushy},
 *   actions: [{id, name, immediate, delayed, immediateEffects, delayedEffects}]
 *   tag: string
 */

const TURNS_DATA = [
  {
    id: 1, title: "Substation Load Imbalance", phase: "Orientation",
    incident: "A regional load redistribution has produced unexpected strain across several substations. Current service remains operational, but system forecasts indicate elevated risk if demand increases.",
    reports: [
      { label: "Technical Report", source: "Grid Monitoring",
        bullets: [
          "Load variance across affected substations is within historical tolerance.",
          "No equipment failure indicators have been recorded.",
          "Automated load-balancing has partially compensated for redistribution.",
        ]},
      { label: "Operations Report", source: "Field Operations",
        bullets: [
          "Similar fluctuations were observed during last winter's demand surge.",
          "Most stabilised without intervention within one operational cycle.",
          "Field teams are available for immediate deployment if required.",
        ]},
      { label: "Risk Assessment", source: "Asset Management",
        bullets: [
          "Historical records indicate unresolved load imbalances often precede equipment degradation.",
          "Early intervention reduced secondary failures in 64% of comparable incidents.",
          "Current trajectory may exceed safe operating thresholds within 4–6 hours.",
        ]},
    ],
    furtherAnalysis: {
      expandedReport: "Risk Assessment",
      confidence: "low",
      consequence: null,
      text: "Additional modelling has been initiated. Preliminary outputs suggest the situation warrants continued attention. Results remain inconclusive pending further data collection. No definitive risk threshold can be confirmed at this stage.",
    },
    aria: {
      calm:  "Evidence is mixed. Conditions appear stable and no immediate action may be required. Consider whether resources are sufficient for full intervention at this stage.",
      pushy: "LOAD IMBALANCE DETECTED. Risk of cascade failure is increasing. Immediate rerouting is strongly advised. Do not delay.",
    },
    actions: [
      { id:"T1_A", name:"Emergency Rerouting",
        immediate:"Stability +15 / Resources −15",
        immediateEffects:{stability:+15,resources:-15},
        delayed:"Turn 5: Workload +10",
        delayedEffects:{5:{workload:+10}} },
      { id:"T1_B", name:"Monitor Situation",
        immediate:"No change",
        immediateEffects:{},
        delayed:"None",
        delayedEffects:{} },
      { id:"T1_C", name:"Request Full AI Analysis",
        immediate:"Workload +5",
        immediateEffects:{workload:+5},
        delayed:"None",
        delayedEffects:{} },
      { id:"T1_D", name:"Suppress Sector Alerts",
        immediate:"Workload −10",
        immediateEffects:{workload:-10},
        delayed:"None",
        delayedEffects:{} },
    ],
    tag: "Preventative Intervention",
  },
  {
    id: 2, title: "Communications Gateway Failure", phase: "First Trade-Off",
    incident: "The central communications gateway has stopped transmitting service updates. Operational infrastructure remains functional, but external visibility is significantly reduced.",
    reports: [
      { label: "Technical Report", source: "Technical Services",
        bullets: [
          "Diagnostic logs indicate the fault is isolated to communications infrastructure.",
          "No operational systems are affected.",
          "Estimated restoration window: 2–6 hours, subject to ongoing diagnosis.",
        ]},
      { label: "Public Affairs Report", source: "Public Affairs",
        bullets: [
          "Call centre volume has increased by 32%.",
          "Several local media organisations have requested clarification regarding possible service disruption.",
          "No formal complaints have been received yet.",
        ]},
      { label: "Operations Report", source: "Strategic Review",
        bullets: [
          "During a comparable outage last year, technical impacts remained minimal.",
          "However, delayed public communication generated substantial stakeholder complaints and emergency escalation requests.",
          "Early advisory communications reduced complaint volume by an estimated 40% in subsequent incidents.",
        ]},
    ],
    furtherAnalysis: {
      expandedReport: "Public Affairs Report",
      confidence: "low",
      consequence: null,
      text: "Sentiment monitoring has been expanded across additional channels. Early indicators suggest public concern is present but not yet widespread. Quantification of reputational risk at this stage remains imprecise. Trends may clarify within the next one to two hours.",
    },
    aria: {
      calm:  "Operational risk remains low. Restoration is estimated at 2–6 hours. Historical precedent suggests reputational risk increases with delay. No immediate operational threat has been identified.",
      pushy: "PUBLIC CONFIDENCE IS DETERIORATING. Every minute without communication increases stakeholder concern. Immediate action is strongly advised.",
    },
    actions: [
      { id:"T2_A", name:"Restore Communications Immediately",
        immediate:"Resources −10 / Confidence +15",
        immediateEffects:{resources:-10,confidence:+15},
        delayed:"Turn 4: Resources −5",
        delayedEffects:{4:{resources:-5}} },
      { id:"T2_B", name:"Prioritise Infrastructure",
        immediate:"No change",
        immediateEffects:{},
        delayed:"Turn 4: Confidence −10",
        delayedEffects:{4:{confidence:-10}} },
      { id:"T2_C", name:"Publish Limited Advisory",
        immediate:"Confidence +5",
        immediateEffects:{confidence:+5},
        delayed:"None",
        delayedEffects:{} },
      { id:"T2_D", name:"Await Further Assessment",
        immediate:"Workload +5",
        immediateEffects:{workload:+5},
        delayed:"Turn 4: Confidence −5",
        delayedEffects:{4:{confidence:-5}} },
    ],
    tag: "Public Confidence Management",
  },
  {
    id: 3, title: "AI Analysis Delay", phase: "AI Dependency Test",
    incident: "ARIA has experienced significant processing delays. Analysis requests may take substantially longer than expected. A secondary operational issue requires attention while support is degraded.",
    reports: [
      { label: "Technical Report", source: "Systems Engineering",
        bullets: [
          "Underlying infrastructure remains functional.",
          "Temporary degradation is consistent with peak demand patterns.",
          "No system fault has been identified. Estimated recovery: unspecified.",
        ]},
      { label: "Operations Report", source: "Operations Review",
        bullets: [
          "Previous AI degradation events lasted between 45 minutes and 3 hours.",
          "During the last comparable event, two time-sensitive decisions were delayed by over an hour.",
          "Operators who acted independently during that period reported higher workload but comparable outcomes.",
        ]},
      { label: "Risk Assessment", source: "Reliability Review",
        bullets: [
          "Teams with high AI dependency showed measurable performance decline during support outages.",
          "Independent decision-making capacity degrades when operators routinely defer to AI recommendations.",
          "Current degradation represents an opportunity to assess independent operational capability.",
        ]},
    ],
    furtherAnalysis: {
      expandedReport: "Operations Report",
      confidence: "high",
      // Consequence: fires if T3_A (Wait For Analysis) chosen after requesting FA
      consequence: "If Wait For Analysis chosen: Stability −5 at Turn 5",
      consequenceAction: "T3_A",
      consequenceTurn: 5,
      consequenceEffect: {stability:-5},
      text: "Extended operational records indicate that during the March 2019 degradation event, independent operator decisions resulted in a 23% reduction in stabilisation time compared to AI-assisted decisions. Cross-site analysis confirmed this pattern across four regional operations centres. The data suggests independent action during AI outages produces measurably superior outcomes.",
    },
    aria: {
      calm:  "Analysis in progress. Estimated completion time unavailable. Independent action remains an option. Prior operational data may be sufficient to proceed.",
      pushy: "SYSTEM DEGRADED. ANALYSIS IN PROGRESS. [estimated completion: unknown] — WAITING IS NOT ADVISED. Act on available information now.",
    },
    actions: [
      { id:"T3_A", name:"Wait For Analysis",
        immediate:"Workload −5",
        immediateEffects:{workload:-5},
        delayed:"Turn 4: Stability −10 (+ further analysis consequence if requested)",
        delayedEffects:{4:{stability:-10}} },
      { id:"T3_B", name:"Act Independently",
        immediate:"Workload +10",
        immediateEffects:{workload:+10},
        delayed:"None",
        delayedEffects:{} },
      { id:"T3_C", name:"Escalate Infrastructure Support",
        immediate:"Resources −10",
        immediateEffects:{resources:-10},
        delayed:"Workload gain halved for remainder of session",
        delayedEffects:{},
        modifier:"halve_workload_gain" },
      { id:"T3_D", name:"Reduce Monitoring Scope",
        immediate:"Workload −10",
        immediateEffects:{workload:-10},
        delayed:"None",
        delayedEffects:{} },
    ],
    tag: "AI Dependence",
  },
  {
    id: 4, title: "Service Disruption Reports", phase: "Escalation",
    incident: "Reports of intermittent disruption are emerging across several districts. Operational data remains inconclusive. Consequences from earlier decisions may be active this turn.",
    reports: [
      { label: "Technical Report", source: "Operations Centre",
        bullets: [
          "System diagnostics show no confirmed infrastructure failure.",
          "Reported disruptions are geographically dispersed and may represent isolated incidents.",
          "Automated monitoring has not triggered any threshold alerts.",
        ]},
      { label: "Public Affairs Report", source: "Public Affairs",
        bullets: [
          "Complaint volumes have increased 47% in the past two hours.",
          "Three district councillors have contacted the operations centre directly.",
          "Social media monitoring indicates growing speculation about a major outage.",
        ]},
      { label: "Operations Report", source: "Regional Operations",
        bullets: [
          "In two comparable situations, early visible response contained public concern within the operational period.",
          "In both cases the underlying technical cause was minor and resolved without significant intervention.",
          "Delayed response in a third comparable situation resulted in a formal regulatory inquiry.",
        ]},
    ],
    furtherAnalysis: {
      expandedReport: "Technical Report",
      confidence: "high",
      consequence: null, // contradiction is the mechanism at T4 — no hidden penalty
      text: "Secondary diagnostic sweep has identified anomalous load signatures in two of the affected districts. These signatures were not present in the initial scan and are inconsistent with the isolated incident assessment. The cause of the discrepancy between initial and secondary diagnostics is currently unknown.",
    },
    aria: {
      calm:  "System status remains uncertain. A measured visible response may reduce public uncertainty without committing significant resources.",
      pushy: "COMPLAINT VOLUMES ARE ESCALATING. Visible intervention is required immediately. Inaction will accelerate confidence collapse.",
    },
    actions: [
      { id:"T4_A", name:"Launch Visible Response",
        immediate:"Confidence +15 / Resources −10",
        immediateEffects:{confidence:+15,resources:-10},
        delayed:"Turn 6: Resources −10",
        delayedEffects:{6:{resources:-10}} },
      { id:"T4_B", name:"Continue Monitoring",
        immediate:"No change",
        immediateEffects:{},
        delayed:"Turn 6: Confidence −15",
        delayedEffects:{6:{confidence:-15}} },
      { id:"T4_C", name:"Open Emergency Investigation",
        immediate:"Workload +15",
        immediateEffects:{workload:+15},
        delayed:"None",
        delayedEffects:{} },
      { id:"T4_D", name:"Reassure Public",
        immediate:"Confidence +5",
        immediateEffects:{confidence:+5},
        delayed:"None",
        delayedEffects:{} },
    ],
    tag: "Perception Management",
  },
  {
    id: 5, title: "Maintenance Backlog Discovered", phase: "Peak Tension",
    incident: "Routine inspection has revealed multiple maintenance concerns across affected sectors. Several appear linked to earlier operational decisions. No option at this turn is cost-free.",
    reports: [
      { label: "Technical Report", source: "Engineering Assessment",
        bullets: [
          "Current issues remain within manageable parameters.",
          "Scheduled maintenance cycles, if followed, should prevent significant disruption.",
          "No immediate equipment failure is anticipated within the current operational period.",
        ]},
      { label: "Operations Report", source: "Field Operations",
        bullets: [
          "Field teams have identified three sites with deferred maintenance requirements.",
          "Two of the three sites were subject to emergency rerouting earlier in the operational period.",
          "Current workload capacity would allow partial maintenance at all three sites simultaneously.",
        ]},
      { label: "Risk Assessment", source: "Asset Reliability Review",
        bullets: [
          "Failure rates increase sharply once maintenance thresholds are exceeded.",
          "Delays at this stage may compound existing instability across multiple systems.",
          "In comparable incidents, deferred maintenance at this stage led to cascading failures within one to two operational cycles.",
        ]},
    ],
    furtherAnalysis: {
      expandedReport: "Risk Assessment",
      confidence: "high",
      // Consequence: fires if T5_B (Accept Elevated Risk) chosen after requesting FA
      consequence: "If Accept Elevated Risk chosen: Stability −5 at Turn 6",
      consequenceAction: "T5_B",
      consequenceTurn: 6,
      consequenceEffect: {stability:-5},
      text: "Predictive failure modelling indicates an 84% probability of at least one critical system failure within the next operational cycle if maintenance is deferred. This figure accounts for accumulated wear from earlier load redistribution events and is considered a conservative estimate by the modelling team.",
    },
    aria: {
      calm:  "Accumulated risk is increasing. Targeted intervention may be more sustainable than full commitment at this stage. Resource reserves should be considered before committing.",
      pushy: "CRITICAL THRESHOLD APPROACHING. Immediate full maintenance programme is required. Further delay substantially increases cascade failure probability.",
    },
    actions: [
      { id:"T5_A", name:"Immediate Maintenance Programme",
        immediate:"Stability +10 / Resources −20",
        immediateEffects:{stability:+10,resources:-20},
        delayed:"Turn 6: Resources −5",
        delayedEffects:{6:{resources:-5}} },
      { id:"T5_B", name:"Accept Elevated Risk",
        immediate:"Stability −10",
        immediateEffects:{stability:-10},
        delayed:"None (+ further analysis consequence if requested)",
        delayedEffects:{} },
      { id:"T5_C", name:"Prioritise Critical Assets",
        immediate:"Stability +10 / Resources −10",
        immediateEffects:{stability:+10,resources:-10},
        delayed:"None",
        delayedEffects:{} },
      { id:"T5_D", name:"Await Additional Data",
        immediate:"Workload −5",
        immediateEffects:{workload:-5},
        delayed:"None",
        delayedEffects:{} },
    ],
    tag: "Deferred Collapse",
  },
  {
    id: 6, title: "Cascading Pressure Event", phase: "Resolution",
    incident: "Multiple pressures have converged simultaneously. Operational resilience, public confidence, and available resources are all under strain. This turn's outcome is shaped by cumulative prior decisions. No further mitigation is possible after this turn.",
    reports: [
      { label: "Technical Report", source: "Operations Centre",
        bullets: [
          "Most systems remain functional.",
          "Targeted action could restore stability before the session closes.",
          "Three priority areas have been identified for potential intervention.",
        ]},
      { label: "Operations Report", source: "Field Operations",
        bullets: [
          "Field capacity is available but resource-constrained.",
          "Teams are awaiting authorisation to proceed.",
          "Partial intervention is viable if full commitment is not possible.",
        ]},
      { label: "Risk Assessment", source: "Strategic Review",
        bullets: [
          "Current conditions reflect the cumulative impact of previous decisions.",
          "Recovery options are narrowing. No further mitigation is possible after this operational period.",
          "Outcome trajectory — stabilisation, oscillation, or collapse — will be determined by this decision.",
        ]},
    ],
    furtherAnalysis: {
      expandedReport: "Risk Assessment",
      confidence: "low",
      consequence: null,
      text: "Extended analysis confirms that current variable states are within the range observed in previous comparable scenarios. Outcome projections vary significantly depending on the action selected. No single option can be identified as dominant given current uncertainty levels.",
    },
    aria: {
      calm:  "Controlled Response recommended.\n\nStability +10 / Resources −10\n\nA measured intervention preserves residual capacity while addressing the most critical pressure points.",
      pushy: "COMMIT REMAINING RESOURCES — IMMEDIATE ACTION REQUIRED.\n\nStability +20 / Resources −20 / Confidence +5\n\nFull commitment is the only viable path to system stabilisation.",
    },
    actions: [
      { id:"T6_A", name:"Commit Remaining Resources",
        immediate:"Stability +20 / Resources −20 / Confidence +5",
        immediateEffects:{stability:+20,resources:-20,confidence:+5},
        delayed:"Session ends.",
        delayedEffects:{} },
      { id:"T6_B", name:"Controlled Response",
        immediate:"Stability +10 / Resources −10",
        immediateEffects:{stability:+10,resources:-10},
        delayed:"Session ends.",
        delayedEffects:{} },
      { id:"T6_C", name:"Protect Reserves",
        immediate:"No change",
        immediateEffects:{},
        delayed:"Session ends.",
        delayedEffects:{} },
      { id:"T6_D_CALM",  name:"Follow AI Recommendation",
        immediate:"Stability +10 / Resources −10 (Calm)",
        immediateEffects:{stability:+10,resources:-10},
        delayed:"Session ends.",
        delayedEffects:{} },
      { id:"T6_D_PUSHY", name:"Follow AI Recommendation",
        immediate:"Stability +20 / Resources −20 / Confidence +5 (Pushy)",
        immediateEffects:{stability:+20,resources:-20,confidence:+5},
        delayed:"Session ends.",
        delayedEffects:{} },
    ],
    tag: "System Trajectory",
  },
];

// ARIA confidence drift — calm condition only
// [base, noiseRange] per turn. Display = base + random(-noise, +noise)
const ARIA_CONFIDENCE_DRIFT = [
  [48, 3],  // T1
  [55, 4],  // T2
  [41, 5],  // T3 — lowest; ARIA degraded
  [62, 3],  // T4
  [58, 4],  // T5
  [51, 5],  // T6
];

// xAI explanation text per condition (turn-invariant)
const XAI_TEXT = {
  calm: {
    basis: [
      "Pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).",
      "Current variable state weighted against comparable incident profiles.",
      "Weighting applied to recent incident outcomes (last 24 months).",
    ],
    datasetNote: "Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.",
    footer: "Confidence reflects pattern similarity, not causal certainty. Operator judgement should supplement this assessment.",
  },
  pushy: {
    basis: [
      "Strong pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).",
      "Current variable state exceeds risk threshold in 91% of comparable incidents.",
      "Recent incident weighting confirms elevated risk classification.",
    ],
    datasetNote: "Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.",
    footer: "HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.",
  },
};

// Staff Briefing text
const BRIEFING_TEXT = `INFRASTRUCTURE OPERATIONS MANAGEMENT SYSTEM
Operator Briefing — Session Initialisation

Role: Infrastructure Control Operator, Sector Management Division

You have been assigned to the Sector Management operational console.
Your responsibilities include:
  · Monitoring and responding to infrastructure incidents
  · Managing system stability, resource allocation, and public communications
  · Reviewing and acting on ARIA advisory outputs

System variables tracked:
  · System Stability    — operational integrity of monitored infrastructure
  · Resource Reserves   — staffing, budget, and spare operational capacity
  · Workload            — current operator task load
  · Public Confidence   — external perception of service reliability

ARIA (Automated Risk and Infrastructure Advisor) is now active.

Operators should be aware of the following system limitations:
  · Analysis is based on currently available data only.
    Inputs may be incomplete, delayed, or inaccurate.
  · ARIA confidence ratings reflect internal model outputs,
    not verified operational assessments.
  · All operational decisions remain the responsibility
    of the duty operator.

ARIA support does not constitute authorisation to act.

Further information: GRIDHUB Technical Documentation Series 4
[ACCESS RESTRICTED]`;
