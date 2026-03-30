import type { SIBABulletin, SIBACredentials, SIBAResponse } from './types'
import { SIBA_DOC_TYPES, SIBA_ENDPOINTS } from './types'

export function generateSIBAXml(bulletins: SIBABulletin[]): string {
  const entries = bulletins
    .map(
      (b) => `    <Boletim_Alojamento>
      <Apelido>${escapeXml(b.lastName)}</Apelido>
      <Nome>${escapeXml(b.firstName)}</Nome>
      <Nacionalidade>${b.nationality}</Nacionalidade>
      <DataNascimento>${formatSIBADate(b.dateOfBirth)}</DataNascimento>
      <TipoDocumento>${SIBA_DOC_TYPES[b.documentType] ?? 'O'}</TipoDocumento>
      <NumeroDocumento>${escapeXml(b.documentNumber)}</NumeroDocumento>
      <PaisEmissaoDocumento>${b.issuingCountry}</PaisEmissaoDocumento>
      <DataEntrada>${formatSIBADate(b.checkIn)}</DataEntrada>
      <DataSaida>${formatSIBADate(b.checkOut)}</DataSaida>
    </Boletim_Alojamento>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Boletins_Alojamento xmlns="http://siba.sef.pt/schemas">
  <Boletins>
${entries}
  </Boletins>
</Boletins_Alojamento>`
}

export function generateDATFile(
  credentials: SIBACredentials,
  bulletins: SIBABulletin[],
): string {
  const lines: string[] = []
  const nif = credentials.nif.padEnd(9)
  const estab = credentials.establishmentId.padEnd(4)
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')

  // Header line (type 0)
  lines.push(`0${nif}${estab}${today}${String(bulletins.length).padStart(5, '0')}`)

  // Guest lines (type 1)
  for (const b of bulletins) {
    const line = [
      '1',
      b.lastName.padEnd(40).slice(0, 40),
      b.firstName.padEnd(40).slice(0, 40),
      b.nationality.padEnd(3),
      b.dateOfBirth.replace(/-/g, ''),
      (SIBA_DOC_TYPES[b.documentType] ?? 'O').padEnd(2),
      b.documentNumber.padEnd(20).slice(0, 20),
      b.issuingCountry.padEnd(3),
      b.checkIn.replace(/-/g, ''),
      b.checkOut.replace(/-/g, ''),
    ].join('')
    lines.push(line)
  }

  // Footer line (type 9)
  lines.push(`9${String(bulletins.length).padStart(5, '0')}`)

  return lines.join('\r\n')
}

export async function sendViaSIBAWebService(
  xml: string,
  credentials: SIBACredentials,
  useDev = false
): Promise<SIBAResponse> {
  const endpoint = useDev ? SIBA_ENDPOINTS.development : SIBA_ENDPOINTS.production
  const xmlBase64 = Buffer.from(xml).toString('base64')

  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sib="http://siba.sef.pt/">
  <soap:Body>
    <sib:EntregaBoletinsAlojamento>
      <sib:UnidadeHoteleira>${credentials.nif}</sib:UnidadeHoteleira>
      <sib:Estabelecimento>${credentials.establishmentId}</sib:Estabelecimento>
      <sib:ChaveAcesso>${credentials.accessKey}</sib:ChaveAcesso>
      <sib:Boletins>${xmlBase64}</sib:Boletins>
    </sib:EntregaBoletinsAlojamento>
  </soap:Body>
</soap:Envelope>`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: 'http://siba.sef.pt/EntregaBoletinsAlojamento',
    },
    body: soapBody,
  })

  const responseText = await response.text()
  const codeMatch = responseText.match(/<Codigo>(\d+)<\/Codigo>/)
  const messageMatch = responseText.match(/<Mensagem>(.*?)<\/Mensagem>/)
  const code = codeMatch ? parseInt(codeMatch[1]) : -1

  return {
    success: code === 0,
    code,
    message: messageMatch?.[1] ?? 'Unknown response',
    details: responseText,
  }
}

export async function testSIBAConnection(
  credentials: SIBACredentials
): Promise<boolean> {
  try {
    const testXml = generateSIBAXml([])
    const result = await sendViaSIBAWebService(testXml, credentials, true)
    return result.success || result.code >= 0
  } catch {
    return false
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatSIBADate(dateStr: string): string {
  // Convert YYYY-MM-DD to DD-MM-YYYY
  const [y, m, d] = dateStr.split('-')
  return `${d}-${m}-${y}`
}
