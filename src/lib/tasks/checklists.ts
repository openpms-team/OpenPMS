import type { TaskType } from '@/types/database'

interface ChecklistTemplate {
  items: { pt: string; en: string; fr: string }[]
}

const DEFAULT_CHECKLISTS: Record<string, ChecklistTemplate> = {
  cleaning: {
    items: [
      { pt: 'Limpar casa de banho', en: 'Clean bathroom', fr: 'Nettoyer la salle de bain' },
      { pt: 'Mudar roupa de cama', en: 'Change bed linen', fr: 'Changer les draps' },
      { pt: 'Aspirar/Varrer', en: 'Vacuum/Sweep', fr: 'Aspirer/Balayer' },
      { pt: 'Limpar cozinha', en: 'Clean kitchen', fr: 'Nettoyer la cuisine' },
      { pt: 'Repor consumíveis', en: 'Restock supplies', fr: 'Réapprovisionner' },
      { pt: 'Verificar toalhas', en: 'Check towels', fr: 'Vérifier les serviettes' },
      { pt: 'Lixo', en: 'Take out trash', fr: 'Sortir les poubelles' },
    ],
  },
  inspection: {
    items: [
      { pt: 'Verificar limpeza', en: 'Check cleanliness', fr: 'Vérifier la propreté' },
      { pt: 'Colocar kit boas-vindas', en: 'Place welcome kit', fr: 'Placer le kit de bienvenue' },
      { pt: 'Testar WiFi', en: 'Test WiFi', fr: 'Tester le WiFi' },
      { pt: 'Verificar AC', en: 'Check AC', fr: 'Vérifier la climatisation' },
      { pt: 'Colocar chaves/código', en: 'Set keys/code', fr: 'Mettre les clés/code' },
    ],
  },
  maintenance: {
    items: [
      { pt: 'Identificar problema', en: 'Identify issue', fr: 'Identifier le problème' },
      { pt: 'Resolver/Reparar', en: 'Fix/Repair', fr: 'Résoudre/Réparer' },
      { pt: 'Testar solução', en: 'Test solution', fr: 'Tester la solution' },
      { pt: 'Documentar', en: 'Document', fr: 'Documenter' },
    ],
  },
}

export function getDefaultChecklist(
  taskType: TaskType,
  locale: string
): Array<{ item: string; done: boolean }> {
  const template = DEFAULT_CHECKLISTS[taskType]
  if (!template) return []

  const lang = locale as 'pt' | 'en' | 'fr'
  return template.items.map((item) => ({
    item: item[lang] ?? item.en ?? item.pt,
    done: false,
  }))
}
