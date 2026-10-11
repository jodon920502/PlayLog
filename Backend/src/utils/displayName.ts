export const DISPLAY_NAME_MIN_LENGTH = 1
export const DISPLAY_NAME_MAX_LENGTH = 30

export function hasDisplayNameWhitespace(value: string): boolean {
  return /\s/u.test(value)
}

export function isValidDisplayName(value: string): boolean {
  const length = Array.from(value).length
  return length >= DISPLAY_NAME_MIN_LENGTH
    && length <= DISPLAY_NAME_MAX_LENGTH
    && !hasDisplayNameWhitespace(value)
}

export function displayNameValidationMessage(value: string): string {
  if (hasDisplayNameWhitespace(value)) return '顯示名稱不可包含空白'
  return '顯示名稱長度必須介於 1 到 30 個字元'
}
