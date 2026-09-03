import { GameSession } from './application/game-session.js'
import { languageOf } from './i18n.js'
import { BrowserStorage, browserRuntime } from './platform/browser.js'
import { Repository } from './storage.js'
import { difficultyOf } from './game/difficulty.js'
import { MinesweeperApp } from './ui/minesweeper-app.js'

/** Compose browser adapters, application state, and UI at the only startup boundary. */
function bootstrap(): MinesweeperApp {
  const root = document.querySelector<HTMLDivElement>('#app')

  if (!root) {
    throw new Error('App root is missing')
  }

  const repository = new Repository(new BrowserStorage())
  repository.migrateLegacy()

  const params = new URLSearchParams(location.search)
  const preferences = repository.preferences()
  const language = languageOf(params.get('lang') ?? preferences.language ?? navigator.language)
  const mode = difficultyOf(params.get('mode') ?? preferences.difficulty)
  const session = new GameSession(repository, browserRuntime, mode)

  return new MinesweeperApp(root, session, repository, language)
}

const app = bootstrap()

// Release listeners and checkpoint progress before Vite replaces this module.
import.meta.hot?.dispose(() => app.dispose())
