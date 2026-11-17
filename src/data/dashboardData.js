export const projectsData = [
  {
    id: "proj-1",
    name: "Booster Gas Compressor 55 MMSCFD",
    code: "EE-BGC-55",
    client: "Energy Equity Epic (Sengkang) Pty. Ltd.",
    status: "ahead",
    statusLabel: "+3.63% Ahead",
    delayedAlternativeLabel: "Delayed (-3.73%)",
    lastUpdate: "29 Aug 2025",
    location: "Kampung Baru, Wajo, South Sulawesi",
    contractValue: "Rp 25,33 Miliar",
    planProgress: 89.82,
    actualProgress: 93.45,
    deviation: "+3.63%",
    currentWeek: "W-46",
    cutoffDate: "29 Aug 2025, 14:30 WITA"
  },
  {
    id: "proj-2",
    name: "KP-9 Flowline Construction",
    code: "EE-FL-KP09",
    client: "Energy Equity Epic (Sengkang) Pty. Ltd.",
    status: "delayed",
    statusLabel: "-6.15% Delayed",
    lastUpdate: "19 Aug 2025",
    location: "Sengkang Gas Field",
    contractValue: "Rp 14,80 Miliar",
    planProgress: 72.40,
    actualProgress: 66.25,
    deviation: "-6.15%",
    currentWeek: "W-44",
    cutoffDate: "19 Aug 2025, 17:00 WITA"
  },
  {
    id: "proj-3",
    name: "Pipeline Integrity Survey",
    code: "EE-PIS-2025",
    client: "Energy Equity Epic (Sengkang) Pty. Ltd.",
    status: "ontrack",
    statusLabel: "On Track",
    lastUpdate: "18 Aug 2025",
    location: "Offshore & Main Trunkline",
    contractValue: "Rp 8,65 Miliar",
    planProgress: 45.00,
    actualProgress: 45.50,
    deviation: "+0.50%",
    currentWeek: "W-44",
    cutoffDate: "18 Aug 2025, 11:00 WITA"
  },
  {
    id: "proj-4",
    name: "CPF Facility Upgrade",
    code: "EE-CPF-MOD",
    client: "Energy Equity Epic (Sengkang) Pty. Ltd.",
    status: "ontrack",
    statusLabel: "On Track",
    lastUpdate: "17 Aug 2025",
    location: "Central Processing Facility",
    contractValue: "Rp 32,10 Miliar",
    planProgress: 61.20,
    actualProgress: 62.00,
    deviation: "+0.80%",
    currentWeek: "W-44",
    cutoffDate: "17 Aug 2025, 16:15 WITA"
  },
  {
    id: "proj-5",
    name: "Access Road Rehabilitation",
    code: "EE-ARR-02",
    client: "Energy Equity Epic (Sengkang) Pty. Ltd.",
    status: "watchlist",
    statusLabel: "Watchlist",
    lastUpdate: "16 Aug 2025",
    location: "Field Access Corridors",
    contractValue: "Rp 4,20 Miliar",
    planProgress: 88.00,
    actualProgress: 84.50,
    deviation: "-3.50%",
    currentWeek: "W-44",
    cutoffDate: "16 Aug 2025, 09:30 WITA"
  }
];

export const kpiOverview = {
  contractValue: "Rp 25,33 Miliar",
  currency: "IDR (Rupiah)",
  budgetText: "Budget Approved",
  planProgress: "89.82%",
  actualProgress: "93.45%",
  planVsActualText: "Actual 3.63% ahead of plan",
  deviation: "+3.63%",
  deviationBadge: "Ahead / On Track",
  categories: [
    {
      name: "Engineering",
      plan: "2.54%",
      act: "2.54%",
      dev: "0.00%",
      status: "neutral",
      weight: "2.54%"
    },
    {
      name: "Procurement",
      plan: "74.92%",
      act: "77.03%",
      dev: "+2.10%",
      status: "ahead",
      weight: "77.85%"
    },
    {
      name: "Construction",
      plan: "9.53%",
      act: "11.05%",
      dev: "+1.53%",
      status: "ahead",
      weight: "15.17%"
    },
    {
      name: "Commissioning",
      plan: "0.00%",
      act: "0.00%",
      dev: "0.00%",
      status: "neutral",
      weight: "1.37%"
    }
  ]
};

export const scurveData = [
  { week: "W-28", date: "25-Apr", plan: 32.10, actual: 31.40, forecast: null },
  { week: "W-29", date: "02-May", plan: 35.80, actual: 36.20, forecast: null },
  { week: "W-30", date: "09-May", plan: 40.10, actual: 41.50, forecast: null },
  { week: "W-31", date: "16-May", plan: 44.60, actual: 46.00, forecast: null },
  { week: "W-32", date: "23-May", plan: 49.30, actual: 51.20, forecast: null },
  { week: "W-33", date: "30-May", plan: 54.00, actual: 56.10, forecast: null },
  { week: "W-34", date: "06-Jun", plan: 58.70, actual: 61.30, forecast: null },
  { week: "W-35", date: "13-Jun", plan: 63.40, actual: 66.00, forecast: null },
  { week: "W-36", date: "20-Jun", plan: 67.80, actual: 70.80, forecast: null },
  { week: "W-37", date: "27-Jun", plan: 71.90, actual: 75.10, forecast: null },
  { week: "W-38", date: "04-Jul", plan: 75.80, actual: 79.20, forecast: null },
  { week: "W-39", date: "11-Jul", plan: 79.30, actual: 82.60, forecast: null },
  { week: "W-40", date: "18-Jul", plan: 82.40, actual: 85.50, forecast: null },
  { week: "W-41", date: "25-Jul", plan: 84.80, actual: 87.70, forecast: null },
  { week: "W-42", date: "01-Aug", plan: 86.60, actual: 89.40, forecast: null },
  { week: "W-43", date: "08-Aug", plan: 87.90, actual: 90.80, forecast: null },
  { week: "W-44", date: "15-Aug", plan: 88.80, actual: 91.90, forecast: null },
  { week: "W-45", date: "22-Aug", plan: 89.35, actual: 92.70, forecast: null },
  { week: "W-46", date: "29-Aug-25", plan: 89.82, actual: 93.45, forecast: 93.45 },
  { week: "W-47", date: "05-Sep", plan: 92.20, actual: null, forecast: 95.80 },
  { week: "W-48", date: "12-Sep", plan: 95.10, actual: null, forecast: 97.60 },
  { week: "W-49", date: "19-Sep", plan: 97.90, actual: null, forecast: 99.10 },
  { week: "W-50", date: "26-Sep", plan: 100.00, actual: null, forecast: 100.00 }
];

export const forecastMetrics = {
  estimatedCompletionDate: "19 Sep 2025 (W-49)",
  earlyVarianceDays: "+7 Days Ahead",
  plannedCompletionDate: "26 Sep 2025 (W-50)",
  spi: "1.040",
  spiStatus: "Favorable (Ahead)",
  requiredRunRate: "1.64% / week",
  currentRunRate: "2.15% / week",
  confidenceLevel: "96.8% (P80)"
};

export const forecastDetailedSeries = [
  {
    week: "W-44",
    date: "15-Aug",
    plan: 88.80,
    actual: 91.90,
    forecastTrend: 91.90,
    forecastOptimistic: 91.90,
    forecastPessimistic: 91.90,
    weeklyDelta: 1.10,
    milestone: null,
    isCutoff: false
  },
  {
    week: "W-45",
    date: "22-Aug",
    plan: 89.35,
    actual: 92.70,
    forecastTrend: 92.70,
    forecastOptimistic: 92.70,
    forecastPessimistic: 92.70,
    weeklyDelta: 0.80,
    milestone: null,
    isCutoff: false
  },
  {
    week: "W-46",
    date: "29-Aug-25",
    plan: 89.82,
    actual: 93.45,
    forecastTrend: 93.45,
    forecastOptimistic: 93.45,
    forecastPessimistic: 93.45,
    weeklyDelta: 0.75,
    milestone: "Cutoff W-46 (Actual 93.45%)",
    isCutoff: true
  },
  {
    week: "W-47",
    date: "05-Sep",
    plan: 92.20,
    actual: null,
    forecastTrend: 95.80,
    forecastOptimistic: 96.50,
    forecastPessimistic: 94.70,
    weeklyDelta: 2.35,
    milestone: "Mechanical Completion",
    isCutoff: false
  },
  {
    week: "W-48",
    date: "12-Sep",
    plan: 95.10,
    actual: null,
    forecastTrend: 97.60,
    forecastOptimistic: 98.80,
    forecastPessimistic: 96.20,
    weeklyDelta: 1.80,
    milestone: "Pre-Comm & Nitrogen Purging",
    isCutoff: false
  },
  {
    week: "W-49",
    date: "19-Sep",
    plan: 97.90,
    actual: null,
    forecastTrend: 99.20,
    forecastOptimistic: 100.00,
    forecastPessimistic: 97.80,
    weeklyDelta: 1.60,
    milestone: "RFSU / Early Finish (19-Sep)",
    isCutoff: false
  },
  {
    week: "W-50",
    date: "26-Sep",
    plan: 100.00,
    actual: null,
    forecastTrend: 100.00,
    forecastOptimistic: 100.00,
    forecastPessimistic: 99.10,
    weeklyDelta: 0.80,
    milestone: "Planned Contract COD Target",
    isCutoff: false
  },
  {
    week: "W-51",
    date: "03-Oct",
    plan: 100.00,
    actual: null,
    forecastTrend: 100.00,
    forecastOptimistic: 100.00,
    forecastPessimistic: 100.00,
    weeklyDelta: 0.00,
    milestone: "Buffer Completion Window",
    isCutoff: false
  }
];

export const progressSummaryRows = [
  {
    no: "1",
    code: "A",
    item: "PREPARATION",
    weight: 3.06,
    prevWeek: { plan: 3.06, actual: 3.06 },
    thisWeek: { plan: 0.00, actual: 0.00 },
    cumulative: { plan: 3.06, actual: 3.06 },
    variance: 0.00,
    status: "Completed"
  },
  {
    no: "2",
    code: "B.1",
    item: "ENGINEERING",
    weight: 2.54,
    prevWeek: { plan: 2.54, actual: 2.54 },
    thisWeek: { plan: 0.00, actual: 0.00 },
    cumulative: { plan: 2.54, actual: 2.54 },
    variance: 0.00,
    status: "Completed"
  },
  {
    no: "3",
    code: "B.2",
    item: "PROCUREMENT",
    weight: 77.85,
    prevWeek: { plan: 74.45, actual: 76.28 },
    thisWeek: { plan: 0.47, actual: 0.75 },
    cumulative: { plan: 74.92, actual: 77.03 },
    variance: 2.10,
    status: "Ahead"
  },
  {
    no: "4",
    code: "B.3",
    item: "CONSTRUCTION",
    weight: 15.17,
    prevWeek: { plan: 9.06, actual: 10.32 },
    thisWeek: { plan: 0.47, actual: 0.73 },
    cumulative: { plan: 9.53, actual: 11.05 },
    variance: 1.53,
    status: "Ahead"
  },
  {
    no: "5",
    code: "B.4",
    item: "PRE-COMMISSIONING & START UP",
    weight: 1.37,
    prevWeek: { plan: 0.00, actual: 0.00 },
    thisWeek: { plan: 0.00, actual: 0.00 },
    cumulative: { plan: 0.00, actual: 0.00 },
    variance: 0.00,
    status: "Pending"
  }
];

export const hseData = {
  totalManhours: "186,056 hrs",
  thisWeekManhours: "13,064 hrs",
  ltaFatality: "0 (Zero Accident)",
  safeDays: 284,
  permitToWork: 48,
  toolboxMeetingAttendance: "100%",
  environmentalSpill: "0"
};

export const progressDetailItems = [
  {
    no: 1,
    description: "Site Preparation",
    category: "Civil & Infrastructure",
    subcontractor: "PT. Toha Sittah Energi",
    planPercent: 100.0,
    actualPercent: 100.0,
    color: "bg-slate-800",
    status: "Completed",
    notes: "Done, after construction assurance",
    isObstacle: false
  },
  {
    no: 2,
    description: "Piling & Foundations",
    category: "Civil Works",
    subcontractor: "PT. Karya Pancang Jaya",
    planPercent: 100.0,
    actualPercent: 100.0,
    color: "bg-slate-800",
    status: "Completed",
    notes: "Done",
    isObstacle: false
  },
  {
    no: 3,
    description: "Piping Fabrication & Installation",
    category: "Mechanical & Piping",
    subcontractor: "PT. Matra Engineering",
    planPercent: 98.44,
    actualPercent: 74.67,
    color: "bg-amber-500",
    status: "Delayed",
    notes: "Welding repairs & generator broken",
    isObstacle: true
  },
  {
    no: 4,
    description: "Field Instrument & Gas Metering",
    category: "Instrumentation & Control",
    subcontractor: "PT. Yokogawa Indonesia",
    planPercent: 96.00,
    actualPercent: 94.90,
    color: "bg-blue-600",
    status: "On Track",
    notes: "Delivery time long lead items",
    isObstacle: true
  },
  {
    no: 5,
    description: "Electrical Works",
    category: "Electrical System",
    subcontractor: "PT. Dwi Tunggal Jaya Agung",
    planPercent: 88.00,
    actualPercent: 86.20,
    color: "bg-amber-500",
    status: "Watchlist",
    notes: "All 12 pendant lights installed",
    isObstacle: false
  }
];

export const thisWeekActivities = {
  period: "W-46: 23 - 29 Aug 2025",
  groups: [
    {
      title: "Engineering & QC",
      color: "border-sky-500 text-sky-700 bg-sky-50",
      icon: "FileCheck2",
      activities: [
        { text: "Inspection N2 Generator at vendor shop", status: "completed" },
        { text: "Review MDR Pipe Support & Pressure Vessel", status: "completed" },
        { text: "Preparation drawing OH Crane certification with BKI", status: "in_progress" }
      ]
    },
    {
      title: "Procurement",
      color: "border-emerald-500 text-emerald-700 bg-emerald-50",
      icon: "Truck",
      activities: [
        { text: "Delivery SIKAGROUT 215 batch 3 to site", status: "completed" },
        { text: "Delivery LV Switchgear & Distribution Panel", status: "completed" },
        { text: "Delivery E&I Bulk Material to site warehouse", status: "completed" }
      ]
    },
    {
      title: "Construction & HSE",
      color: "border-amber-500 text-amber-700 bg-amber-50",
      icon: "HardHat",
      activities: [
        { text: "Skidding GEC#2 to foundation pad", status: "completed" },
        { text: "Setup Cable Tray at CCR Building & Pipe Rack", status: "in_progress" },
        { text: "13,064 safe manhours reached with zero accident record", status: "milestone" }
      ]
    }
  ],
  photos: [
    {
      id: 1,
      title: "Foundation of Gas Compressors & Shelter, Pipe Rack",
      timestamp: "29 Aug 2025",
      location: "Compressor Pad Bay A",
      tag: "Civil & Structure",
      accent: "from-blue-600 to-indigo-900",
      description: "Reinforced concrete pedestal and base plate preparation for compressor units with pipe rack support frame aligned."
    },
    {
      id: 2,
      title: "Transportation of GEC #6 & Cooler #4 to Site Sengkang",
      timestamp: "01 Sep 2025",
      location: "Heavy Transport Route KM-14",
      tag: "Logistics",
      accent: "from-amber-600 to-slate-900",
      description: "Multi-axle heavy cargo trailer en route to Sengkang facility with police escort and site clearance completed."
    },
    {
      id: 3,
      title: "Skidding Gas Engine Compressor #2 to Foundation",
      timestamp: "29 Aug 2025",
      location: "Shelter Bay #2",
      tag: "Mechanical Rigging",
      accent: "from-emerald-600 to-slate-900",
      description: "Hydraulic jacking and heavy skidding operation of 42-ton GEC#2 unit onto permanent anchor bolts."
    },
    {
      id: 4,
      title: "Electrical Works: All 12 Pendant Lights Installed at Shelter",
      timestamp: "25 Aug 2025",
      location: "Main Compressor Shelter",
      tag: "Electrical & Lighting",
      accent: "from-sky-600 to-slate-900",
      description: "Explosion-proof hazardous area LED high-bay pendant fixtures fully mounted, cabled, and tested."
    }
  ]
};

export const nextWeekPlan = {
  period: "W-47: 30 Aug - 05 Sep 2025",
  groups: [
    {
      department: "Engineering",
      icon: "FileCode",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      tasks: [
        {
          id: "eng-1",
          title: "Closing outstanding document & drawing for Penelaah Design",
          priority: "High",
          lead: "M. Ikhsan (Lead Process)",
          deadline: "02 Sep 2025"
        },
        {
          id: "eng-2",
          title: "Follow up FAT Oily Water Pumps inspection protocol",
          priority: "Medium",
          lead: "Dedi S. (Mech QC)",
          deadline: "03 Sep 2025"
        },
        {
          id: "eng-3",
          title: "Follow up FAT SDV, BDV, ON-OFF Valve verification package",
          priority: "High",
          lead: "Hendra P. (Lead I&C)",
          deadline: "04 Sep 2025"
        }
      ]
    },
    {
      department: "Procurement",
      icon: "PackageCheck",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      tasks: [
        {
          id: "proc-1",
          title: "Award installation & hook up equipment Vessel/Compressor/OH Crane 5T to Matra",
          priority: "Urgent",
          lead: "Rina Kartika (Procurement Mgr)",
          deadline: "31 Aug 2025"
        },
        {
          id: "proc-2",
          title: "Leak test Manual Valve on Site warehouse staging area",
          priority: "Medium",
          lead: "Wahyu T. (Materials QA)",
          deadline: "02 Sep 2025"
        },
        {
          id: "proc-3",
          title: "Delivery spare part manlift & scissor lifts to staging area",
          priority: "Low",
          lead: "Faisal B. (Logistics Lead)",
          deadline: "04 Sep 2025"
        }
      ]
    },
    {
      department: "Construction & HSE",
      icon: "HardHat",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      tasks: [
        {
          id: "const-1",
          title: "Install GEC Unit #6 to foundation pad with precision laser alignment",
          priority: "Urgent",
          lead: "Supardi (Rigging Super)",
          deadline: "01 Sep 2025"
        },
        {
          id: "const-2",
          title: "Continue pulling & laying instrument cables from JB to CCR building",
          priority: "High",
          lead: "Agus S. (E&I Foreman)",
          deadline: "03 Sep 2025"
        },
        {
          id: "const-3",
          title: "Weekly HSE Inspection & Daily Check Up (DCU) for all high-risk crew",
          priority: "High",
          lead: "Bambang H. (HSE Officer)",
          deadline: "05 Sep 2025"
        }
      ]
    }
  ]
};

