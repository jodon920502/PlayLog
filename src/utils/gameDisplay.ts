import { getGenreDisplayName } from '../data/genreTranslations'

const platformTranslations: Record<string, string> = {
  'PC (Microsoft Windows)': 'Windows',
  Windows: 'Windows',
  'PlayStation 4': 'PS4',
  'PlayStation 5': 'PS5',
  'Xbox One': 'Xbox One',
  'Xbox Series X|S': 'Xbox Series X|S',
  'Nintendo Switch': 'Nintendo Switch',
}

export function formatGenreName(name: string): string {
  return getGenreDisplayName(name)
}

export function formatPlatformName(name: string): string {
  return platformTranslations[name] ?? name
}
