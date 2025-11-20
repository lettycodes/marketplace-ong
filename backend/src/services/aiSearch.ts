import OpenAI from 'openai'
import { logger } from '../utils/logger'
import { logSearchActivity } from './logService'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface SearchFilters {
  category?: string
  priceMin?: number
  priceMax?: number
  keywords?: string[]
  organization?: string
}

export interface AISearchResult {
  filters: SearchFilters
  interpretation: string
  aiSuccess: boolean
  fallbackUsed: boolean
}

const SEARCH_TIMEOUT = 5000

export class AISearchService {
  static async parseNaturalLanguageSearch(
    query: string, 
    userId?: string, 
    organizationId?: string
  ): Promise<AISearchResult> {
    const startTime = Date.now()
    let aiSuccess = false
    let fallbackUsed = false
    let filters: SearchFilters = {}
    let interpretation = ''

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured')
      }

      const prompt = `
Você é um assistente que converte buscas em linguagem natural em filtros estruturados para um marketplace de ONGs.

Analise a seguinte busca: "${query}"

Responda APENAS com um JSON válido no formato:
{
  "filters": {
    "category": "categoria encontrada ou null",
    "priceMin": número mínimo ou null,
    "priceMax": número máximo ou null,
    "keywords": ["palavra1", "palavra2"] ou [],
    "organization": "nome da ONG ou null"
  },
  "interpretation": "descrição em português do que foi interpretado"
}

Categorias disponíveis: Artesanato, Alimentos, Vestuário, Doces, Decoração

Exemplos:
- "doces até 50 reais" -> {"filters": {"category": "Doces", "priceMax": 50}, "interpretation": "Categoria: Doces; Preço máximo: R$ 50"}
- "artesanato da ONG Esperança" -> {"filters": {"category": "Artesanato", "organization": "ONG Esperança"}, "interpretation": "Categoria: Artesanato; Organização: ONG Esperança"}
`

      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.1
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI search timeout')), SEARCH_TIMEOUT)
        )
      ])

      const responseText = completion.choices[0]?.message?.content?.trim()
      
      if (!responseText) {
        throw new Error('Empty AI response')
      }

      const parsed = JSON.parse(responseText)
      filters = parsed.filters || {}
      interpretation = parsed.interpretation || 'Busca processada pela AI'
      aiSuccess = true

      logger.info({
        message: 'AI search successful',
        query,
        filters,
        interpretation,
        duration: Date.now() - startTime
      })

    } catch (error) {
      logger.warn({
        message: 'AI search failed, using fallback',
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })

      fallbackUsed = true
      const result = this.fallbackSearch(query)
      filters = result.filters
      interpretation = result.interpretation
    }

    const totalDuration = Date.now() - startTime

    logger.info({
      message: 'Search completed',
      query,
      filters,
      interpretation,
      aiSuccess,
      fallbackUsed,
      totalDuration
    })

    logSearchActivity({
      userId,
      organizationId,
      searchQuery: query,
      aiFilters: filters,
      aiSuccess,
      fallbackApplied: fallbackUsed,
      latencyMs: totalDuration
    }).catch(err => {
      logger.error('Failed to log search activity:', err)
    })

    return {
      filters,
      interpretation,
      aiSuccess,
      fallbackUsed
    }
  }

  private static fallbackSearch(query: string): { filters: SearchFilters; interpretation: string } {
    const lowercaseQuery = query.toLowerCase()
    const filters: SearchFilters = {}
    const interpretationParts: string[] = []

    const categories = [
      'artesanato', 'alimentos', 'vestuário', 'doces', 'decoração'
    ]

    for (const category of categories) {
      if (lowercaseQuery.includes(category)) {
        filters.category = category.charAt(0).toUpperCase() + category.slice(1)
        interpretationParts.push(`Categoria: ${filters.category}`)
        break
      }
    }

    const priceMatch = lowercaseQuery.match(/(?:até|máximo|max|menor que|<|<=)\s*r?\$?\s*(\d+(?:[.,]\d{1,2})?)/i)
    if (priceMatch) {
      filters.priceMax = parseFloat(priceMatch[1].replace(',', '.'))
      interpretationParts.push(`Preço máximo: R$ ${filters.priceMax}`)
    }

    const priceFromMatch = lowercaseQuery.match(/(?:de|a partir de|mínimo|min|maior que|>|>=)\s*r?\$?\s*(\d+(?:[.,]\d{1,2})?)/i)
    if (priceFromMatch) {
      filters.priceMin = parseFloat(priceFromMatch[1].replace(',', '.'))
      interpretationParts.push(`Preço mínimo: R$ ${filters.priceMin}`)
    }

    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !['ate', 'reais', 'real', 'por', 'para', 'com', 'sem', 'que', 'uma', 'uns', 'das', 'dos', 'nas', 'nos'].includes(word)
      )

    if (words.length > 0) {
      filters.keywords = words
      interpretationParts.push(`Palavras-chave: ${words.join(', ')}`)
    }

    const interpretation = interpretationParts.length > 0 
      ? interpretationParts.join('; ')
      : 'Busca simples por texto'

    return { filters, interpretation }
  }
}