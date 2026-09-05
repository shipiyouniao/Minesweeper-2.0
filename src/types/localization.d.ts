/** Supported interface languages. */
export type Language = 'zh' | 'en' | 'ja'

/** Explicit translation contract shared by all languages. */
export interface Messages {
  readonly title: string
  readonly tagline: string
  readonly intro: string
  readonly edition: string
  readonly play: string
  readonly how: string
  readonly records: string
  readonly language: string
  readonly sound: string
  readonly soundOn: string
  readonly soundOff: string
  readonly easy: string
  readonly medium: string
  readonly expert: string
  readonly custom: string
  readonly difficulty: string
  readonly mines: string
  readonly time: string
  readonly best: string
  readonly restart: string
  readonly pause: string
  readonly resume: string
  readonly ready: string
  readonly readyNote: string
  readonly playing: string
  readonly paused: string
  readonly pausedNote: string
  readonly won: string
  readonly wonNote: string
  readonly lost: string
  readonly lostNote: string
  readonly reveal: string
  readonly flag: string
  readonly markSafe: string
  readonly suspectedSafe: string
  readonly quickReveal: string
  readonly flagMode: string
  readonly revealMode: string
  readonly helpMouse: string
  readonly helpTouch: string
  readonly helpChord: string
  readonly firstSafe: string
  readonly autoSave: string
  readonly source: string
  readonly footer: string
  readonly board: string
  readonly closed: string
  readonly flagged: string
  readonly empty: string
  readonly mine: string
  readonly wrongFlag: string
  readonly row: string
  readonly column: string
  readonly around: string
  readonly close: string
  readonly cancel: string
  readonly start: string
  readonly width: string
  readonly height: string
  readonly mineCount: string
  readonly customHint: string
  readonly invalid: string
  readonly howTitle: string
  readonly howIntro: string
  readonly stepOne: string
  readonly stepOneNote: string
  readonly stepTwo: string
  readonly stepTwoNote: string
  readonly stepThree: string
  readonly stepThreeNote: string
  readonly stepFour: string
  readonly stepFourNote: string
  readonly recordsNote: string
  readonly noRecords: string
  readonly player: string
  readonly date: string
  readonly name: string
  readonly save: string
  readonly recordSaved: string
  readonly storageOff: string
  readonly progress: string
  readonly confirmTitle: string
  readonly confirmNote: string
  readonly scrollHint: string
}

/** Every supported language supplies the same explicit message contract. */
export interface Translations {
  readonly zh: Messages
  readonly en: Messages
  readonly ja: Messages
}
