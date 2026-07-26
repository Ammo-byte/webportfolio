export const experienceScenes = [
  {
    name: "automation",
    label:
      "A reimbursement claim, receipt, and policy pass through an automated workflow and produce a completed reimbursement",
    phases: ["REQUEST", "AUTOMATE", "COMPLETE"],
  },
  {
    name: "growth",
    label:
      "Braze push-token registration signals pass through a marketing data pipeline and produce a 25 percent campaign engagement lift",
    phases: ["SIGNALS", "SEGMENTS", "INSIGHT"],
  },
  {
    name: "rag",
    label:
      "A user question enters a RAG database, retrieves three ranked documents, and produces a verified answer",
    phases: ["QUERY", "RETRIEVE", "ANSWER"],
  },
  {
    name: "compute",
    label:
      "Five billion events compress into HLL registers and produce an 82 percent faster aggregate query",
    phases: ["EVENTS", "SKETCH", "METRIC"],
  },
  {
    name: "retention",
    label:
      "Database and web signals produce customer cancellation-risk scores and a retention action",
    phases: ["CUSTOMERS", "RISK", "RETAIN"],
  },
  {
    name: "forecast",
    label:
      "Historical data passes through deployed containers and produces a forecast with a faster processing cycle",
    phases: ["HISTORY", "DEPLOY", "FORECAST"],
  },
  {
    name: "audit",
    label:
      "Radar and R matrices are compared row by row and reconciled into a verified match",
    phases: ["RADAR + R", "COMPARE", "VERIFIED"],
  },
] as const;

export type ExperienceSceneName = (typeof experienceScenes)[number]["name"];
