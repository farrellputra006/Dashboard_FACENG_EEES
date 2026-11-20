import * as XLSX from 'xlsx';

// Sample template rows
export const templateSampleRows = [
  {
    no: "1",
    code: "A",
    item: "PREPARATION",
    weight: 3.06,
    prevWeekPlan: 3.06,
    prevWeekActual: 3.06,
    thisWeekPlan: 0.00,
    thisWeekActual: 0.00,
    cumPlan: 3.06,
    cumActual: 3.06,
    variance: 0.00,
    status: "Completed"
  },
  {
    no: "2",
    code: "B.1",
    item: "ENGINEERING",
    weight: 2.54,
    prevWeekPlan: 2.54,
    prevWeekActual: 2.54,
    thisWeekPlan: 0.00,
    thisWeekActual: 0.00,
    cumPlan: 2.54,
    cumActual: 2.54,
    variance: 0.00,
    status: "Completed"
  },
  {
    no: "3",
    code: "B.2",
    item: "PROCUREMENT",
    weight: 77.85,
    prevWeekPlan: 74.45,
    prevWeekActual: 76.28,
    thisWeekPlan: 0.47,
    thisWeekActual: 0.75,
    cumPlan: 74.92,
    cumActual: 77.03,
    variance: 2.10,
    status: "Ahead"
  },
  {
    no: "4",
    code: "B.3",
    item: "CONSTRUCTION",
    weight: 15.17,
    prevWeekPlan: 9.06,
    prevWeekActual: 10.32,
    thisWeekPlan: 0.47,
    thisWeekActual: 0.73,
    cumPlan: 9.53,
    cumActual: 11.05,
    variance: 1.53,
    status: "Ahead"
  },
  {
    no: "5",
    code: "B.4",
    item: "PRE-COMMISSIONING & START UP",
    weight: 1.37,
    prevWeekPlan: 0.00,
    prevWeekActual: 0.00,
    thisWeekPlan: 0.00,
    thisWeekActual: 0.00,
    cumPlan: 0.00,
    cumActual: 0.00,
    variance: 0.00,
    status: "Pending"
  }
];

// Function to download an Excel or CSV template
export function downloadProgressTemplate(format = 'xlsx') {
  const exportData = templateSampleRows.map((r) => ({
    "No": r.no,
    "WBS Code": r.code,
    "Item Description": r.item,
    "Weight Factor (%)": r.weight,
    "Prev Week Plan (%)": r.prevWeekPlan,
    "Prev Week Actual (%)": r.prevWeekActual,
    "This Week Plan (%)": r.thisWeekPlan,
    "This Week Actual (%)": r.thisWeekActual,
    "Cumulative Plan (%)": r.cumPlan,
    "Cumulative Actual (%)": r.cumActual,
    "Variance (%)": r.variance,
    "Status": r.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 34 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Progress_Summary");

  if (format === 'csv') {
    XLSX.writeFile(workbook, "Energy_Equity_Progress_Summary_Template.csv", { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, "Energy_Equity_Progress_Summary_Template.xlsx", { bookType: 'xlsx' });
  }
}

// Function to parse any uploaded File (ArrayBuffer or binary string)
export async function parseUploadedProgressFile(file) {
  if (file && (file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf')) {
    throw new Error('File ini bukan format Excel. Untuk menyimpan laporan PDF sebagai arsip, silakan upload di bagian Lampiran Dokumen PDF.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Grab first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Parse to JSON objects
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          throw new Error("File kosong atau tidak memiliki baris data yang valid.");
        }

        // Normalize rows to standard format
        const parsedRows = rawJson.map((row, index) => {
          // Normalize keys (case insensitive / flexible mapping)
          const findVal = (possibleKeys) => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase();
              for (const target of possibleKeys) {
                if (cleanKey.includes(target.toLowerCase())) {
                  return row[key];
                }
              }
            }
            return null;
          };

          const parseNum = (val, defaultVal = 0) => {
            if (val === null || val === undefined || val === '') return defaultVal;
            const cleanStr = String(val).replace(/[%,\s]/g, '');
            const num = parseFloat(cleanStr);
            return isNaN(num) ? defaultVal : num;
          };

          const itemDesc = findVal(['description', 'item', 'activity', 'pekerjaan']) || `Item ${index + 1}`;
          const code = findVal(['wbs', 'code', 'kode']) || `WBS-${index + 1}`;
          const no = findVal(['no', 'nomor', 'id']) || String(index + 1);
          const weight = parseNum(findVal(['weight', 'bobot', 'factor']), 0);

          const prevPlan = parseNum(findVal(['prev plan', 'previous plan', 'rencana lalu', 'prev week plan']), 0);
          const prevAct = parseNum(findVal(['prev act', 'previous act', 'realisasi lalu', 'prev week act']), 0);

          const thisPlan = parseNum(findVal(['this plan', 'minggu ini plan', 'this week plan']), 0);
          const thisAct = parseNum(findVal(['this act', 'minggu ini act', 'this week act']), 0);

          let cumPlan = parseNum(findVal(['cumulative plan', 'cum plan', 'kumulatif rencana', 'total plan']), 0);
          let cumAct = parseNum(findVal(['cumulative act', 'cum act', 'kumulatif realisasi', 'total act']), 0);

          // If cum is 0 but prev + this exists, auto-sum
          if (cumPlan === 0 && (prevPlan > 0 || thisPlan > 0)) {
            cumPlan = parseFloat((prevPlan + thisPlan).toFixed(2));
          }
          if (cumAct === 0 && (prevAct > 0 || thisAct > 0)) {
            cumAct = parseFloat((prevAct + thisAct).toFixed(2));
          }

          let variance = findVal(['variance', 'deviasi', 'dev', 'var']);
          if (variance !== null && variance !== '') {
            variance = parseNum(variance, 0);
          } else {
            variance = parseFloat((cumAct - cumPlan).toFixed(2));
          }

          let status = findVal(['status']) || (cumAct >= 100 ? 'Completed' : variance >= 0 ? 'Ahead' : 'Delayed');

          return {
            no: String(no),
            code: String(code),
            item: String(itemDesc),
            weight: Number(weight),
            prevWeek: { plan: Number(prevPlan), actual: Number(prevAct) },
            thisWeek: { plan: Number(thisPlan), actual: Number(thisAct) },
            cumulative: { plan: Number(cumPlan), actual: Number(cumAct) },
            variance: Number(variance),
            status: String(status)
          };
        });

        resolve({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          importedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          rows: parsedRows
        });
      } catch (err) {
        reject(new Error(`Gagal membaca file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("Terjadi kesalahan saat membaca file lokal."));
    reader.readAsArrayBuffer(file);
  });
}
