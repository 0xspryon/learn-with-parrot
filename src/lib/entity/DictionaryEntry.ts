export interface DictionaryEntry {
  id: string
  word: string
  translation: string
  displayCount: number
  quizDisplayCount: number
}

export const defaultDictionary: DictionaryEntry[] = [
  {
    word: "Good morning",
    translation: "Bonjour",
    id: crypto.randomUUID(),
    displayCount: 0,
    quizDisplayCount: 0,
  },
  {
    word: "Learn with parrot",
    translation: "Apprendre avec le perroquet",
    id: crypto.randomUUID(),
    displayCount: 0,
    quizDisplayCount: 0,
  },
]
