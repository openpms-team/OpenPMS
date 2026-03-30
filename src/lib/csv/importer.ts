export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  separator: string;
  detectedDateFormat: string | null;
}

function detectSeparator(firstLine: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  for (const char of firstLine) {
    if (char in counts) counts[char]++;
  }
  return Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function splitRow(line: string, separator: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

const DATE_PATTERNS: Record<string, RegExp> = {
  eu: /^\d{2}\/\d{2}\/\d{4}$/,
  iso: /^\d{4}-\d{2}-\d{2}$/,
  us: /^\d{2}\/\d{2}\/\d{4}$/,
};

function detectDateFormat(rows: string[][]): string | null {
  const sample = rows.slice(0, 5);
  for (const row of sample) {
    for (const field of row) {
      if (DATE_PATTERNS.iso.test(field)) return 'iso';
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(field)) {
        const [a] = field.split('/').map(Number);
        return a > 12 ? 'eu' : 'us';
      }
    }
  }
  return null;
}

export function parseCSV(content: string): ParsedCSV {
  const cleaned = content.startsWith('\uFEFF') ? content.slice(1) : content;
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [], separator: ',', detectedDateFormat: null };
  }

  const separator = detectSeparator(lines[0]);
  const headers = splitRow(lines[0], separator);
  const rows = lines.slice(1).map((line) => splitRow(line, separator));
  const detectedDateFormat = detectDateFormat(rows);

  return { headers, rows, separator, detectedDateFormat };
}
