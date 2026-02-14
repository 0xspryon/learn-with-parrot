export interface Settings {
  maxEntryDisplayCount: number,
  maxQuizDisplayCount: number,
  displayIntervalSeconds: number,
  nativeLanguage: string
  learnedLanguage: string
  enableNotifications: boolean
  displayDurationSeconds: number
}

export type DisplaySettings = Pick<Settings, 'learnedLanguage' | 'displayIntervalSeconds' | 'displayDurationSeconds'>;

export const defaultSettings: Settings = {
  maxEntryDisplayCount: 50,
  maxQuizDisplayCount: 50,
  displayIntervalSeconds: 30 * 60,
  nativeLanguage: 'en',
  learnedLanguage: 'fr',
  enableNotifications: true,
  displayDurationSeconds: 10,
}
