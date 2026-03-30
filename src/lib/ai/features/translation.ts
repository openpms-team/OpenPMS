import { getConfiguredProvider, canUseAI, trackUsage } from '../core'

export async function translateMessage(
  text: string,
  fromLanguage: string,
  toLanguage: string
): Promise<string> {
  if (!(await canUseAI('translation'))) {
    return text
  }

  const provider = await getConfiguredProvider()
  if (!provider) return text

  const response = await provider.chat({
    system: `Translate the following text from ${fromLanguage} to ${toLanguage}. Return ONLY the translated text, nothing else. Preserve formatting and tone.`,
    user: text,
  })

  await trackUsage('translation', { input: response.inputTokens, output: response.outputTokens })
  return response.text.trim()
}

export async function detectLanguage(text: string): Promise<string> {
  if (!(await canUseAI('translation'))) {
    return 'en'
  }

  const provider = await getConfiguredProvider()
  if (!provider) return 'en'

  const response = await provider.chat({
    system: 'Detect the language of the following text. Return ONLY the ISO 639-1 two-letter language code (e.g., "en", "pt", "fr", "es", "de").',
    user: text,
  })

  await trackUsage('translation', { input: response.inputTokens, output: response.outputTokens })
  return response.text.trim().toLowerCase().slice(0, 2)
}
