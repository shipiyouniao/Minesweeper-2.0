import type { FormSubmission, NavigationKey, UiCommand } from '../types/ui.js'

/** Decode a DOM action attribute into the finite application command union. */
export function parseCommand(value: string): UiCommand | null {
  switch (value) {
    case 'help':
    case 'records':
    case 'close':
    case 'pause':
    case 'flag-mode':
    case 'reveal-mode':
    case 'restart-confirmed':
    case 'new':
      return value
    default:
      return null
  }
}

/** Decode only navigation keys; other keyboard shortcuts are routed separately. */
export function parseNavigation(value: string): NavigationKey | null {
  switch (value) {
    case 'arrowleft':
    case 'arrowright':
    case 'arrowup':
    case 'arrowdown':
    case 'home':
    case 'end':
      return value
    default:
      return null
  }
}

/** Extract a numeric text input without coercing files or missing fields into zero. */
function numberField(data: FormData, key: string): number {
  const value = data.get(key)
  return typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
}

/** Convert browser form data into one of the declared submission models. */
export function parseSubmission(form: string, data: FormData): FormSubmission | null {
  switch (form) {
    case 'custom-form':
      return {
        kind: 'custom',
        config: {
          width: numberField(data, 'width'),
          height: numberField(data, 'height'),
          mines: numberField(data, 'mines'),
        },
      }
    case 'name-form': {
      const name = data.get('name')
      return typeof name === 'string' ? { kind: 'name', name } : null
    }
    default:
      return null
  }
}
