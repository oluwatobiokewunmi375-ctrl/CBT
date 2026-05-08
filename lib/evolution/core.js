import { evolveSystem } from './engine'
import { feedbackLoop } from './feedback'
import { optimizeQuestions } from './questionOptimizer'
import { generateCurriculum } from './curriculum'
import { tuneDifficulty } from './difficultyTuner'

export function cbtEvolutionCore(data) {
  return {
    evolution: evolveSystem(data),
    feedback: feedbackLoop(data.results || []),
    questions: optimizeQuestions(data.question || {}),
    curriculum: generateCurriculum(data),
    difficulty: tuneDifficulty(data.stats || {})
  }
}
