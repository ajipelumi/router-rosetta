import {google} from '@ai-sdk/google'
import {groq} from '@ai-sdk/groq'
import type {LanguageModel} from 'ai'

export type ModelChoice = {
  model: LanguageModel
  provider: 'groq' | 'google'
  id: string
}

const GROQ_MODEL = process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b'
const GOOGLE_MODEL = process.env.GOOGLE_MODEL ?? 'gemini-3.6-flash'

/**
 * Groq's free tier is far more generous than Gemini's, which caps at 20
 * requests per day per model. Prefer Groq when a key is present and fall back
 * to Google otherwise, so a deployment without GROQ_API_KEY keeps working.
 */
export function pickModel(): ModelChoice {
  if (process.env.GROQ_API_KEY) {
    return {model: groq(GROQ_MODEL), provider: 'groq', id: GROQ_MODEL}
  }
  return {model: google(GOOGLE_MODEL), provider: 'google', id: GOOGLE_MODEL}
}

/** The other provider, when one is configured, for use after a rate limit. */
export function fallbackModel(from: ModelChoice['provider']): ModelChoice | null {
  if (from === 'groq' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {model: google(GOOGLE_MODEL), provider: 'google', id: GOOGLE_MODEL}
  }
  if (from === 'google' && process.env.GROQ_API_KEY) {
    return {model: groq(GROQ_MODEL), provider: 'groq', id: GROQ_MODEL}
  }
  return null
}
