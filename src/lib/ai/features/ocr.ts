import { getConfiguredProvider, canUseAI, trackUsage } from '../core'

export interface OCRResult {
  fullName?: string
  nationality?: string
  dateOfBirth?: string
  documentType?: 'passport' | 'id_card'
  documentNumber?: string
  issuingCountry?: string
  expiryDate?: string
  confidence: number
}

const SYSTEM_PROMPT = `Extract identity document fields from this image. Return JSON only with fields: fullName, nationality (3-letter ICAO country code), dateOfBirth (YYYY-MM-DD), documentType (passport or id_card), documentNumber, issuingCountry (3-letter ICAO code), expiryDate (YYYY-MM-DD), confidence (0-1). If a field is unreadable, omit it.`

export async function extractDocumentData(imageBase64: string): Promise<OCRResult> {
  if (!(await canUseAI('ocr'))) {
    return { confidence: 0 }
  }

  const provider = await getConfiguredProvider()
  if (!provider) return { confidence: 0 }

  const response = await provider.chat({
    system: SYSTEM_PROMPT,
    user: 'Extract data from this identity document.',
    images: [imageBase64],
  })

  await trackUsage('ocr', { input: response.inputTokens, output: response.outputTokens })

  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { confidence: 0 }
  } catch {
    return { confidence: 0 }
  }
}
