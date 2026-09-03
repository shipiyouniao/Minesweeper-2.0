import type { GameRepository } from '../src/types/storage.js'
import type { InputActions } from '../src/types/ui.js'

/** Compile-only negative probes: both compilers must reject invalid business commands. */
export function rejectInvalidCommands(repository: GameRepository, input: InputActions): void {
  // @ts-expect-error A difficulty cannot be stored as a language preference.
  repository.setPreference({ key: 'language', value: 'expert' })
  // @ts-expect-error Raw JSON values cannot enter the setting API.
  repository.setPreference({ key: 'name', value: { name: 'Player' } })
  // @ts-expect-error UI commands have a finite vocabulary.
  input.command('delete-all')
  // @ts-expect-error Custom games do not have a ranked leaderboard tab.
  input.selectRecords('custom')
  // @ts-expect-error Form discriminants require their matching payload.
  input.submit({ kind: 'name', config: { width: 9, height: 9, mines: 10 } })
  // @ts-expect-error Non-navigation keys are handled in the browser adapter.
  input.navigate(0, 'f')
}
