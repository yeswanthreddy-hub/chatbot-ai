const STORAGE_KEY = 'yash-chat-messages'

export function loadMessages() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore invalid stored data */
  }
  return []
}

export function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    /* storage unavailable (e.g. private mode), keep chat in memory only */
  }
}