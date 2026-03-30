export interface SIBACredentials {
  nif: string // 9 digits
  establishmentId: string
  accessKey: string
}

export interface SIBABulletin {
  lastName: string
  firstName: string
  nationality: string // ICAO 3-letter code
  dateOfBirth: string // YYYY-MM-DD
  documentType: string // P (passport), BI (ID card), CC (citizen card)
  documentNumber: string
  issuingCountry: string // ICAO 3-letter code
  checkIn: string // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
}

export interface SIBAResponse {
  success: boolean
  code: number
  message: string
  details?: string
}

export const SIBA_DOC_TYPES: Record<string, string> = {
  passport: 'P',
  id_card: 'BI',
  citizen_card: 'CC',
  driving_license: 'C',
  other: 'O',
}

export const SIBA_ENDPOINTS = {
  production: 'https://siba.sef.pt/baws/boletinsalojamento.asmx',
  development: 'https://siba.sef.pt/bawsdev/boletinsalojamento.asmx',
}
