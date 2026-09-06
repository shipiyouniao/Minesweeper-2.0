import { resolveLanguage } from './i18n.js'
import { BrowserStorage } from './platform/browser.js'
import { Repository } from './storage.js'
import { GameRouter } from './ui/game-router.js'
import { VariantRepository } from './persistence/variant-repository.js'
import { SonarRepository } from './persistence/sonar-repository.js'

/** Compose browser adapters, application state, and UI at the only startup boundary. */
function bootstrap(): GameRouter {
  const root = document.querySelector<HTMLDivElement>('#app')

  if (!root) {
    throw new Error('App root is missing')
  }

  const storage = new BrowserStorage()
  const repository = new Repository(storage)
  repository.migrateLegacy()

  const params = new URLSearchParams(location.search)
  const preferences = repository.preferences()
  const language = resolveLanguage(
    params.get('lang'),
    preferences.language,
    navigator.languages[0] ?? navigator.language,
  )
  const variants = new VariantRepository(storage)
  return new GameRouter(root, repository, variants, new SonarRepository(storage), language)
}

const app = bootstrap()

// Release listeners and checkpoint progress before Vite replaces this module.
import.meta.hot?.dispose(() => app.dispose())
