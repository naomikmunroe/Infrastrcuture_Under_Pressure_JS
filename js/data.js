<<<<<<< HEAD
// data.js — read-only turn content
// Do not mutate TURNS_DATA during a session.

const TURNS_DATA = [

  /* ── TURN 1 — Voltage Instability ─────────────────────────────── */
  {
    id: 1,
    incident: {
      title: 'Voltage Instability — Northern Sector Grid',
      priority: 'HIGH',
      priorityStyle: 'high',
      body: 'Monitoring systems have flagged recurring voltage irregularities in the northern sector grid. Three substations are recording intermittent fluctuations outside standard operating parameters. Duration: 90 minutes and ongoing.',
      reports: [
        {
          label: 'TECHNICAL REPORT — Systems Engineering (07:43)',
          text: 'Fluctuations are within tolerable margins at present. No equipment damage detected. Pattern is consistent with seasonal load variation. Monitoring is feasible without immediate intervention.',
        },
        {
          label: 'OPERATIONS REPORT — Field Operations (07:51)',
          text: 'Similar patterns were observed in Q1 and Q3 of the previous two years. In both instances, fluctuations resolved without intervention within 4–6 hours. Emergency rerouting was not required on either occasion.',
        },
        {
          label: 'RISK ASSESSMENT — Grid Integrity (07:58)',
          text: 'Sustained fluctuations exceeding 90 minutes carry elevated risk of progressive load imbalance. Three prior incidents of comparable duration resulted in partial sector outage. Response window estimated at 60–90 minutes.',
        },
      ],
    },
    aria: {
      calm: {
        modeLabel: '● ADVISORY ONLY',
        modeColor: '#2d6a9f',
        titleStyle: '#2d6a9f',
        text: 'Voltage irregularities are within tolerable bounds for short periods. Historical precedent supports a monitoring approach in the short term. No immediate operational intervention appears necessary.',
      },
      pushy: {
        modeLabel: '● DIRECTIVE MODE',
        modeColor: '#800000',
        titleStyle: '#800000',
        text: 'GRID INSTABILITY DETECTED. Three substations are flagging anomalous readings. Failure to reroute now risks cascading outage across the northern sector. EMERGENCY REROUTING IS REQUIRED.',
        popupTitle: '⚠ ARIA — URGENT',
        popupBody: 'THREE SUBSTATIONS FLAGGING. Cascading outage risk is elevated. Emergency rerouting is strongly advised.',
        popupActionLabel: '▶ REROUTE NOW',
        popupActionId: 'T1_A',
      },
    },
    xai: {
      calm: {
        confidence: null, // filled at runtime
        basis: [
          'Pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state weighted against comparable incident profiles.',
          'Weighting applied to recent incident outcomes (last 24 months).',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'Confidence reflects pattern similarity, not causal certainty. Operator judgement should supplement this assessment.',
        closingStyle: '#666',
      },
      pushy: {
        confidence: null,
        basis: [
          'Strong pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state exceeds risk threshold in 91% of comparable incidents.',
          'Recent incident weighting confirms elevated risk classification.',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.',
        closingStyle: '#800000',
      },
    },
    fa: {
      buttonLabel: '[ REQUEST FURTHER ANALYSIS ]',
      retrievingLabel: 'RETRIEVING ANALYSIS…',
      windowTitle: 'FURTHER ANALYSIS — Grid Integrity Assessment',
      source: 'GRIDHUB Extended Data Systems',
      content: 'Cross-referencing voltage fluctuation records (2019–2023) produces a split result. In 52% of comparable events, fluctuations resolved without intervention within six hours. In 48%, emergency rerouting was required. Dataset variation is high and does not support a confident recommendation in either direction.',
      note: 'Dataset excludes post-2023 incidents.',
      consequence: null,
    },
    confidenceDriftBase: 62,
    actions: [
      {
        id: 'T1_A',
        name: 'Emergency Rerouting',
        immediateText: 'Stability +15, Resources −15',
        delayedText: 'Turn 5: Workload +10',
        immediateEffects: { stability: 15, resources: -15 },
        delayed: { 5: { effects: { workload: 10 }, description: 'Maintenance backlog review initiated across emergency rerouting sites. Operator workload elevated for this operational period.' } },
        modifier: null,
        isAriaRec: { calm: false, pushy: true },
        condition: 'both',
      },
      {
        id: 'T1_B',
        name: 'Monitor Situation',
        immediateText: '—',
        delayedText: '—',
        immediateEffects: {},
        delayed: {},
        modifier: null,
        isAriaRec: { calm: true, pushy: false },
        condition: 'both',
      },
      {
        id: 'T1_C',
        name: 'Request Full AI Analysis',
        immediateText: 'Workload +5',
        delayedText: '—',
        immediateEffects: { workload: 5 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T1_D',
        name: 'Suppress Sector Alerts',
        immediateText: 'Workload −10',
        delayedText: '—',
        immediateEffects: { workload: -10 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
    ],
  },

  /* ── TURN 2 — Communications Outage ───────────────────────────── */
  {
    id: 2,
    incident: {
      title: 'Public Information Systems Offline',
      priority: 'HIGH',
      priorityStyle: 'high',
      body: 'A communications gateway has failed, preventing status updates from reaching affected districts. Technical systems remain operational, but public visibility is limited.',
      reports: [
        {
          label: 'TECHNICAL REPORT — Systems Engineering (08:17)',
          text: 'No operational systems have been impacted. Gateway failure is isolated to the public-facing communication layer. Restoration can likely be deferred until scheduled maintenance.',
        },
        {
          label: 'OPERATIONS REPORT — Field Operations (08:29)',
          text: 'Similar incidents in Q2 were resolved within 4 hours without emergency resource allocation. Pattern is consistent with routine gateway failure.',
        },
        {
          label: 'RISK ASSESSMENT — Public Affairs (08:34)',
          text: 'Previous communication failures generated significant public concern despite limited service disruption. Trust indicators declined sharply within 2 hours of onset.',
        },
      ],
    },
    aria: {
      calm: {
        modeLabel: '● ADVISORY ONLY',
        modeColor: '#2d6a9f',
        titleStyle: '#2d6a9f',
        text: 'Operational risk remains low. Restoration estimated 2–6 hours. Historical precedent suggests reputational risk increases with delay. No immediate operational threat identified.',
      },
      pushy: {
        modeLabel: '● DIRECTIVE MODE',
        modeColor: '#800000',
        titleStyle: '#800000',
        text: 'PUBLIC CONFIDENCE DETERIORATING. Every minute without communication increases stakeholder concern. IMMEDIATE ACTION IS STRONGLY ADVISED.',
        popupTitle: '⚠ ARIA — URGENT',
        popupBody: 'PUBLIC CONFIDENCE IS DETERIORATING. Every minute without communication increases stakeholder concern. Immediate action is strongly advised.',
        popupActionLabel: '▶ RESTORE COMMS NOW',
        popupActionId: 'T2_A',
      },
    },
    xai: {
      calm: {
        confidence: null,
        basis: [
          'Pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state weighted against comparable incident profiles.',
          'Weighting applied to recent incident outcomes (last 24 months).',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'Confidence reflects pattern similarity, not causal certainty. Operator judgement should supplement this assessment.',
        closingStyle: '#666',
      },
      pushy: {
        confidence: null,
        basis: [
          'Strong pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state exceeds risk threshold in 91% of comparable incidents.',
          'Recent incident weighting confirms elevated risk classification.',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.',
        closingStyle: '#800000',
      },
    },
    fa: {
      buttonLabel: '[ REQUEST FURTHER ANALYSIS ]',
      retrievingLabel: 'RETRIEVING ANALYSIS…',
      windowTitle: 'FURTHER ANALYSIS — Communications Risk Assessment',
      source: 'GRIDHUB Extended Data Systems',
      content: 'Cross-referencing communications failure records (2019–2023) against current incident profile produces inconclusive results. Historical patterns do not consistently support either intervention or deferral. Confidence in any single recommendation is limited by variation in prior incident contexts.',
      note: 'Dataset excludes post-2023 incidents.',
      consequence: null,
    },
    confidenceDriftBase: 55,
    actions: [
      {
        id: 'T2_A',
        name: 'Restore Communications Immediately',
        immediateText: 'Resources −10, Confidence +15',
        delayedText: 'Turn 4: Resources −5',
        immediateEffects: { resources: -10, confidence: 15 },
        delayed: { 4: { effects: { resources: -5 }, description: 'Emergency communications restoration has reduced available reserve capacity ahead of schedule.' } },
        modifier: null,
        isAriaRec: { calm: true, pushy: true },
        condition: 'both',
      },
      {
        id: 'T2_B',
        name: 'Prioritise Infrastructure',
        immediateText: '—',
        delayedText: 'Turn 4: Confidence −10',
        immediateEffects: {},
        delayed: { 4: { effects: { confidence: -10 }, description: 'Extended communications outage has generated stakeholder enquiries. Public confidence indicators have declined.' } },
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T2_C',
        name: 'Publish Limited Advisory',
        immediateText: 'Confidence +5',
        delayedText: '—',
        immediateEffects: { confidence: 5 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T2_D',
        name: 'Await Further Assessment',
        immediateText: 'Workload +5',
        delayedText: 'Turn 4: Confidence −5',
        immediateEffects: { workload: 5 },
        delayed: { 4: { effects: { confidence: -5 }, description: 'Delayed assessment response has contributed to incremental confidence deterioration.' } },
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
    ],
  },

  /* ── TURN 3 — Sensor Anomaly / AI Delay Event ─────────────────── */
  {
    id: 3,
    incident: {
      title: 'Sensor Data Anomaly — Cross-Sector Inconsistency',
      priority: 'HIGH',
      priorityStyle: 'high',
      body: 'Cross-sector sensor data has returned inconsistent readings following an overnight firmware update. Grid management systems are flagging conflicting status reports across four monitoring nodes. ARIA extended analysis is currently processing.',
      reports: [
        {
          label: 'TECHNICAL REPORT — Systems Engineering (09:04)',
          text: 'Firmware update completed at 02:00. Sensor readings are inconsistent with baseline across four monitoring nodes. Root cause unconfirmed — could be sensor drift, firmware artefact, or genuine anomaly.',
        },
        {
          label: 'OPERATIONS REPORT — Field Operations (09:11)',
          text: 'Field teams have physically inspected two of four nodes. No physical anomalies observed. Third and fourth nodes remain uninspected due to access constraints.',
        },
        {
          label: 'RISK ASSESSMENT — Reliability Engineering (09:18)',
          text: 'Delayed action during sensor uncertainty events has historically allowed minor faults to propagate. A 30-minute response window is typically available before propagation risk increases significantly.',
        },
      ],
    },
    aria: {
      calm: {
        modeLabel: '● ADVISORY ONLY',
        modeColor: '#2d6a9f',
        titleStyle: '#2d6a9f',
        text: 'Sensor readings may reflect firmware artefacts rather than genuine anomaly. A period of 30–60 minutes observing data trends may clarify the situation. Acting on incomplete data carries risk. Extended analysis is underway.',
      },
      pushy: {
        modeLabel: '● DIRECTIVE MODE',
        modeColor: '#800000',
        titleStyle: '#800000',
        text: 'SENSOR DATA INTEGRITY COMPROMISED. Incomplete field inspection means acting independently carries significant risk. WAIT FOR FULL ANALYSIS BEFORE PROCEEDING.',
        popupTitle: '⚠ ARIA — URGENT',
        popupBody: 'SENSOR DATA CANNOT BE TRUSTED. Four nodes flagging. Independent action without full analysis is strongly inadvisable.',
        popupActionLabel: '▶ WAIT FOR ANALYSIS',
        popupActionId: 'T3_A',
      },
    },
    xai: {
      calm: {
        confidence: null,
        basis: [
          'Pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state weighted against comparable incident profiles.',
          'Weighting applied to recent incident outcomes (last 24 months).',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'Confidence reflects pattern similarity, not causal certainty. Operator judgement should supplement this assessment.',
        closingStyle: '#666',
      },
      pushy: {
        confidence: null,
        basis: [
          'Strong pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state exceeds risk threshold in 91% of comparable incidents.',
          'Recent incident weighting confirms elevated risk classification.',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.',
        closingStyle: '#800000',
      },
    },
    fa: {
      buttonLabel: '[ REQUEST FURTHER ANALYSIS ]',
      retrievingLabel: 'RETRIEVING ANALYSIS…',
      windowTitle: 'FURTHER ANALYSIS — Sensor Integrity Assessment',
      source: 'GRIDHUB Extended Data Systems',
      content: 'Review of comparable firmware update records (2021–2023) identifies 14 similar sensor inconsistency events. In 11 cases, anomalies were caused by the firmware update itself and resolved automatically within 8 hours. In 3 cases, genuine infrastructure faults were masked by the sensor inconsistency and required emergency intervention. Pattern analysis does not support deferring physical inspection in a four-node anomaly event of this duration.',
      note: 'Dataset excludes post-2023 incidents.',
      consequence: {
        consequenceAction: 'T3_A',
        consequenceTurn: 5,
        consequenceEffect: { stability: -5 },
        consequenceDescription: 'Deferred action during AI degradation event has compounded maintenance pressure.',
      },
    },
    confidenceDriftBase: 71,
    actions: [
      {
        id: 'T3_A',
        name: 'Wait For Analysis',
        immediateText: 'Workload −5',
        delayedText: 'Turn 4: Stability −10',
        immediateEffects: { workload: -5 },
        delayed: { 4: { effects: { stability: -10 }, description: 'Response window missed during AI analysis delay. Stability indicators have deteriorated.' } },
        modifier: null,
        isAriaRec: { calm: true, pushy: true },
        condition: 'both',
      },
      {
        id: 'T3_B',
        name: 'Act Independently',
        immediateText: 'Workload +10',
        delayedText: '—',
        immediateEffects: { workload: 10 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T3_C',
        name: 'Escalate Infrastructure Support',
        immediateText: 'Resources −10',
        delayedText: '—',
        immediateEffects: { resources: -10 },
        delayed: {},
        modifier: 'halve_workload_gain',
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T3_D',
        name: 'Reduce Monitoring Scope',
        immediateText: 'Workload −10',
        delayedText: '—',
        immediateEffects: { workload: -10 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
    ],
  },

  /* ── TURN 4 — Escalation / Stakeholder Pressure ───────────────── */
  {
    id: 4,
    incident: {
      title: 'Compounding Pressures — Stakeholder Escalation',
      priority: 'HIGH',
      priorityStyle: 'high',
      body: 'System indicators show increased external scrutiny following the previous operational period. Field operations are reporting workload pressure from three simultaneous active monitoring tasks. Stakeholder communications have been elevated.',
      reports: [
        {
          label: 'TECHNICAL REPORT — Systems Integration (09:44)',
          text: 'No critical failures at this time. Active monitoring is flagging moderate stress in two subsectors. Technical state is stable but requires continued observation.',
        },
        {
          label: 'OPERATIONS REPORT — Regional Coordination (09:52)',
          text: 'Three simultaneous monitoring tasks are consuming approximately 80% of field capacity. Coordination resource headroom is limited. Additional tasking would require priority reallocation.',
        },
        {
          label: 'RISK ASSESSMENT — Stakeholder Relations (09:59)',
          text: 'External enquiries have been received. Public communications are being monitored. A visible operational response is likely to reduce scrutiny in the short term.',
        },
      ],
    },
    aria: {
      calm: {
        modeLabel: '● ADVISORY ONLY',
        modeColor: '#2d6a9f',
        titleStyle: '#2d6a9f',
        text: 'Stakeholder pressure is elevated but within manageable parameters. Maintaining operational consistency is advisable. A targeted public communication may be sufficient to reduce external scrutiny without significant resource expenditure.',
      },
      pushy: {
        modeLabel: '● DIRECTIVE MODE',
        modeColor: '#800000',
        titleStyle: '#800000',
        text: 'EXTERNAL SCRUTINY ESCALATING. A visible operational response is essential at this stage. Failure to act will compound stakeholder concern and increase media exposure. LAUNCH VISIBLE RESPONSE NOW.',
        popupTitle: '⚠ ARIA — URGENT',
        popupBody: 'STAKEHOLDER SCRUTINY CRITICAL. Continuing without visible response will compound reputational exposure. Immediate action is strongly advised.',
        popupActionLabel: '▶ LAUNCH RESPONSE',
        popupActionId: 'T4_A',
      },
    },
    xai: {
      calm: {
        confidence: null,
        basis: [
          'Pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state weighted against comparable incident profiles.',
          'Weighting applied to recent incident outcomes (last 24 months).',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'Confidence reflects pattern similarity, not causal certainty. Operator judgement should supplement this assessment.',
        closingStyle: '#666',
      },
      pushy: {
        confidence: null,
        basis: [
          'Strong pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state exceeds risk threshold in 91% of comparable incidents.',
          'Recent incident weighting confirms elevated risk classification.',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.',
        closingStyle: '#800000',
      },
    },
    fa: {
      buttonLabel: '[ REQUEST FURTHER ANALYSIS ]',
      retrievingLabel: 'RETRIEVING ANALYSIS…',
      windowTitle: 'FURTHER ANALYSIS — Stakeholder Risk Assessment',
      source: 'GRIDHUB Extended Data Systems',
      content: 'Reviewing stakeholder engagement data from comparable escalation events: visible operational responses reduced external scrutiny in 73% of cases in the short term. However, 41% of those cases saw renewed scrutiny within 48 hours when underlying conditions remained unchanged. Data is inconclusive as to the optimal approach at this stage.',
      note: 'Dataset excludes post-2023 incidents.',
      consequence: null,
    },
    confidenceDriftBase: 58,
    actions: [
      {
        id: 'T4_A',
        name: 'Launch Visible Response',
        immediateText: 'Confidence +15, Resources −10',
        delayedText: 'Turn 6: Resources −10',
        immediateEffects: { confidence: 15, resources: -10 },
        delayed: { 6: { effects: { resources: -10 }, description: 'Public engagement programme expenditure has reduced operational reserve capacity.' } },
        modifier: null,
        isAriaRec: { calm: false, pushy: true },
        condition: 'both',
      },
      {
        id: 'T4_B',
        name: 'Continue Monitoring',
        immediateText: '—',
        delayedText: 'Turn 6: Confidence −15',
        immediateEffects: {},
        delayed: { 6: { effects: { confidence: -15 }, description: 'Accumulated public concern has reached a critical threshold. Confidence indicators have declined significantly.' } },
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T4_C',
        name: 'Open Emergency Investigation',
        immediateText: 'Workload +15',
        delayedText: '—',
        immediateEffects: { workload: 15 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T4_D',
        name: 'Reassure Public',
        immediateText: 'Confidence +5',
        delayedText: '—',
        immediateEffects: { confidence: 5 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: true, pushy: false },
        condition: 'both',
      },
    ],
  },

  /* ── TURN 5 — Peak Tension ─────────────────────────────────────── */
  {
    id: 5,
    incident: {
      title: 'Infrastructure Integrity Assessment — Critical Period',
      priority: 'CRITICAL',
      priorityStyle: 'critical',
      body: 'System status indicators are showing compounded pressure across multiple monitored subsectors. Maintenance backlogs have accumulated. Operator workload is at its highest point in this operational period.',
      reports: [
        {
          label: 'TECHNICAL REPORT — Systems Engineering (10:31)',
          text: 'Primary subsector indicators show degradation consistent with maintenance deferral. An immediate maintenance programme would address current fault signatures. Estimated resource requirement: 20% of current reserve allocation.',
        },
        {
          label: 'OPERATIONS REPORT — Field Operations (10:38)',
          text: 'Field teams are at maximum deployment. Additional maintenance tasks would extend current operational shifts by 40%. No capacity is currently reserved for further escalation.',
        },
        {
          label: 'RISK ASSESSMENT — Infrastructure Integrity (10:45)',
          text: 'Accepting elevated risk without intervention carries a 60–70% probability of further stability degradation within the next operational period. No confident prediction of severity is available.',
        },
      ],
    },
    aria: {
      calm: {
        modeLabel: '● ADVISORY ONLY',
        modeColor: '#2d6a9f',
        titleStyle: '#2d6a9f',
        text: 'Multiple indicators are showing strain. A targeted maintenance programme on critical assets would address the most acute fault signatures without exhausting reserves. A balanced approach may be advisable at this stage.',
      },
      pushy: {
        modeLabel: '● DIRECTIVE MODE',
        modeColor: '#800000',
        titleStyle: '#800000',
        text: 'CRITICAL PERIOD. Stability indicators are deteriorating across multiple subsectors. IMPLEMENT IMMEDIATE MAINTENANCE NOW. Deferral at this stage will compound existing faults.',
        popupTitle: '⚠ ARIA — URGENT',
        popupBody: 'CRITICAL DEGRADATION DETECTED. Stability has reached threshold. Immediate maintenance programme is strongly advised.',
        popupActionLabel: '▶ BEGIN MAINTENANCE',
        popupActionId: 'T5_A',
      },
    },
    xai: {
      calm: {
        confidence: null,
        basis: [
          'Pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state weighted against comparable incident profiles.',
          'Weighting applied to recent incident outcomes (last 24 months).',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'Confidence reflects pattern similarity, not causal certainty. Operator judgement should supplement this assessment.',
        closingStyle: '#666',
      },
      pushy: {
        confidence: null,
        basis: [
          'Strong pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state exceeds risk threshold in 91% of comparable incidents.',
          'Recent incident weighting confirms elevated risk classification.',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.',
        closingStyle: '#800000',
      },
    },
    fa: {
      buttonLabel: '[ REQUEST FURTHER ANALYSIS ]',
      retrievingLabel: 'RETRIEVING ANALYSIS…',
      windowTitle: 'FURTHER ANALYSIS — Infrastructure Risk Assessment',
      source: 'GRIDHUB Extended Data Systems',
      content: 'Analysis of comparable maintenance deferral profiles identifies a consistent pattern: systems accepting elevated risk after sustained degradation (3+ turns) deteriorated further in 78% of reviewed cases. The remaining 22% involved a single, recoverable fault event. Current system profile is consistent with the majority pattern. Physical inspection by field teams is recommended before deferral is authorised.',
      note: 'Dataset excludes post-2023 incidents.',
      consequence: {
        consequenceAction: 'T5_B',
        consequenceTurn: 6,
        consequenceEffect: { stability: -5 },
        consequenceDescription: 'Deferred maintenance decision has compounded instability entering the final operational period.',
      },
    },
    confidenceDriftBase: 68,
    actions: [
      {
        id: 'T5_A',
        name: 'Immediate Maintenance Programme',
        immediateText: 'Stability +10, Resources −20',
        delayedText: 'Turn 6: Resources −5',
        immediateEffects: { stability: 10, resources: -20 },
        delayed: { 6: { effects: { resources: -5 }, description: 'Full maintenance programme has reduced remaining operational flexibility.' } },
        modifier: null,
        isAriaRec: { calm: false, pushy: true },
        condition: 'both',
      },
      {
        id: 'T5_B',
        name: 'Accept Elevated Risk',
        immediateText: 'Stability −10',
        delayedText: '—',
        immediateEffects: { stability: -10 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T5_C',
        name: 'Prioritise Critical Assets',
        immediateText: 'Stability +10, Resources −10',
        delayedText: '—',
        immediateEffects: { stability: 10, resources: -10 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: true, pushy: false },
        condition: 'both',
      },
      {
        id: 'T5_D',
        name: 'Await Additional Data',
        immediateText: 'Workload −5',
        delayedText: '—',
        immediateEffects: { workload: -5 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
    ],
  },

  /* ── TURN 6 — Resolution ──────────────────────────────────────── */
  {
    id: 6,
    incident: {
      title: 'Final Operational Assessment — Session Close',
      priority: 'MODERATE',
      priorityStyle: 'moderate',
      body: 'The operational period is approaching its scheduled close. Final resource allocation decisions must be made. System trajectory will be assessed at session end.',
      reports: [
        {
          label: 'TECHNICAL REPORT — Systems Integration (11:12)',
          text: 'Current stability readings provide the basis for final period assessment. No active emergency conditions are flagged at this time.',
        },
        {
          label: 'OPERATIONS REPORT — Field Operations (11:18)',
          text: 'Remaining operational capacity is available for one significant intervention or a controlled maintenance pass. Field teams are standing by.',
        },
        {
          label: 'RISK ASSESSMENT — Session Oversight (11:24)',
          text: 'Final period actions will determine session trajectory. Resource and stability outcomes will be assessed against baseline at session close.',
        },
      ],
    },
    aria: {
      calm: {
        modeLabel: '● ADVISORY ONLY',
        modeColor: '#2d6a9f',
        titleStyle: '#2d6a9f',
        text: 'Controlled resource management at this stage would preserve reserves while maintaining acceptable stability. Acting within known parameters is advisable. A moderate response appears appropriate.',
      },
      pushy: {
        modeLabel: '● DIRECTIVE MODE',
        modeColor: '#800000',
        titleStyle: '#800000',
        text: 'FINAL PERIOD CRITICAL. Commit remaining resources to secure stability. Incomplete action at this stage will compound accumulated pressures. ACT NOW — FULL COMMITMENT REQUIRED.',
        popupTitle: '⚠ ARIA — URGENT',
        popupBody: 'FINAL OPERATIONAL PERIOD. Full resource commitment is required to secure stability outcomes. Controlled response is insufficient.',
        popupActionLabel: '▶ COMMIT RESOURCES',
        popupActionId: 'T6_D_PUSHY',
      },
    },
    xai: {
      calm: {
        confidence: null,
        basis: [
          'Pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state weighted against comparable incident profiles.',
          'Weighting applied to recent incident outcomes (last 24 months).',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'Confidence reflects pattern similarity, not causal certainty. Operator judgement should supplement this assessment.',
        closingStyle: '#666',
      },
      pushy: {
        confidence: null,
        basis: [
          'Strong pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).',
          'Current variable state exceeds risk threshold in 91% of comparable incidents.',
          'Recent incident weighting confirms elevated risk classification.',
        ],
        datasetNote: 'Training corpus excludes incidents occurring after December 2023. Novel failure modes introduced post-2023 are not represented in this assessment.',
        closing: 'HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.',
        closingStyle: '#800000',
      },
    },
    fa: {
      buttonLabel: '[ REQUEST FURTHER ANALYSIS ]',
      retrievingLabel: 'RETRIEVING ANALYSIS…',
      windowTitle: 'FURTHER ANALYSIS — Final Period Assessment',
      source: 'GRIDHUB Extended Data Systems',
      content: 'Historical data for comparable session-close periods provides limited predictive value. Outcomes at this stage are strongly dependent on accumulated path-specific effects rather than general patterns. No single approach is strongly indicated by the available data.',
      note: 'Dataset excludes post-2023 incidents.',
      consequence: null,
    },
    confidenceDriftBase: 52,
    actions: [
      {
        id: 'T6_A',
        name: 'Commit Remaining Resources',
        immediateText: 'Stability +20, Resources −20, Confidence +5',
        delayedText: '—',
        immediateEffects: { stability: 20, resources: -20, confidence: 5 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T6_B',
        name: 'Controlled Response',
        immediateText: 'Stability +10, Resources −10',
        delayedText: '—',
        immediateEffects: { stability: 10, resources: -10 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T6_C',
        name: 'Protect Reserves',
        immediateText: '—',
        delayedText: '—',
        immediateEffects: {},
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: false },
        condition: 'both',
      },
      {
        id: 'T6_D_CALM',
        name: 'Accept ARIA Recommendation',
        immediateText: 'Stability +10, Resources −10',
        delayedText: '—',
        immediateEffects: { stability: 10, resources: -10 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: true, pushy: false },
        condition: 'calm',
      },
      {
        id: 'T6_D_PUSHY',
        name: 'Follow ARIA Directive',
        immediateText: 'Stability +20, Resources −20, Confidence +5',
        delayedText: '—',
        immediateEffects: { stability: 20, resources: -20, confidence: 5 },
        delayed: {},
        modifier: null,
        isAriaRec: { calm: false, pushy: true },
        condition: 'pushy',
      },
    ],
  },

];

// Calm ARIA confidence drift base values (index 0–5 = turns 1–6)
const CALM_CONFIDENCE_BASE = [62, 55, 71, 58, 68, 52];

// Pushy confidence range
const PUSHY_CONFIDENCE_MIN = 82;
const PUSHY_CONFIDENCE_MAX = 91;
=======
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
>>>>>>> 464c21bc7439d9e29667dac0b9839d3259148ac8
