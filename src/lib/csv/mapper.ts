export interface ColumnMapping {
  guestName: number;
  checkIn: number;
  checkOut: number;
  guestEmail?: number;
  guestPhone?: number;
  numGuests?: number;
  totalAmount?: number;
  notes?: number;
}

export interface MappedReservation {
  guest_name: string;
  check_in: string;
  check_out: string;
  guest_email?: string;
  guest_phone?: string;
  num_guests?: number;
  total_amount?: number;
  notes?: string;
}

export function validateMapping(
  mapping: ColumnMapping,
  headerCount: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const inRange = (idx: number, name: string): void => {
    if (idx < 0 || idx >= headerCount) {
      errors.push(`${name} column index ${idx} is out of range (0-${headerCount - 1})`);
    }
  };

  if (mapping.guestName == null) errors.push('guestName is required');
  else inRange(mapping.guestName, 'guestName');

  if (mapping.checkIn == null) errors.push('checkIn is required');
  else inRange(mapping.checkIn, 'checkIn');

  if (mapping.checkOut == null) errors.push('checkOut is required');
  else inRange(mapping.checkOut, 'checkOut');

  return { valid: errors.length === 0, errors };
}

export function convertDate(value: string, format: string | null): string {
  const trimmed = value.trim();
  if (format === 'iso') return trimmed;

  if (format === 'eu') {
    const [d, m, y] = trimmed.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  if (format === 'us') {
    const [m, d, y] = trimmed.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString().slice(0, 10);
}

function optionalString(row: string[], idx: number | undefined): string | undefined {
  if (idx == null || idx < 0 || idx >= row.length) return undefined;
  const val = row[idx].trim();
  return val || undefined;
}

export function mapRows(
  rows: string[][],
  mapping: ColumnMapping,
  dateFormat: string | null
): { mapped: MappedReservation[]; errors: Array<{ row: number; message: string }> } {
  const mapped: MappedReservation[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  rows.forEach((row, idx) => {
    const guestName = row[mapping.guestName]?.trim();
    const rawCheckIn = row[mapping.checkIn]?.trim();
    const rawCheckOut = row[mapping.checkOut]?.trim();

    if (!guestName || !rawCheckIn || !rawCheckOut) {
      errors.push({ row: idx + 1, message: 'Missing required field (name, check-in, or check-out)' });
      return;
    }

    const reservation: MappedReservation = {
      guest_name: guestName,
      check_in: convertDate(rawCheckIn, dateFormat),
      check_out: convertDate(rawCheckOut, dateFormat),
    };

    const email = optionalString(row, mapping.guestEmail);
    if (email) reservation.guest_email = email;

    const phone = optionalString(row, mapping.guestPhone);
    if (phone) reservation.guest_phone = phone;

    const numGuestsStr = optionalString(row, mapping.numGuests);
    if (numGuestsStr) {
      const parsed = parseInt(numGuestsStr, 10);
      if (!isNaN(parsed)) reservation.num_guests = parsed;
    }

    const totalStr = optionalString(row, mapping.totalAmount);
    if (totalStr) {
      const parsed = parseFloat(totalStr);
      if (!isNaN(parsed)) reservation.total_amount = parsed;
    }

    const notesVal = optionalString(row, mapping.notes);
    if (notesVal) reservation.notes = notesVal;

    mapped.push(reservation);
  });

  return { mapped, errors };
}
