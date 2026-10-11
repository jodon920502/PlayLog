const genreTranslations: Record<string, string> = {
  Adventure: '冒險',
  Shooter: '射擊',
  'Role-playing (RPG)': '角色扮演',
  Indie: '獨立遊戲',
  Platform: '平台跳躍',
  Racing: '競速',
  Simulator: '模擬',
  "Hack and slash/Beat 'em up": '砍殺／清版動作',
  Strategy: '策略',
  Tactical: '戰術',
  Arcade: '街機',
  Puzzle: '益智解謎',
}

export function getGenreDisplayName(genreName: string): string {
  return genreTranslations[genreName] ?? genreName
}
