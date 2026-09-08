import { tokenUtils } from '../utils/tokenUtils'
import { logger } from '../utils/logger'

const PUSH_TOKEN_KEY = 'push_device_token'

type Toast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

let _pendingNavigation: Record<string, string> | null = null
let _activeChatId: string | null = null

export function setActiveChatId(id: string | null) {
  _activeChatId = id
}

// Suppress lint warning — activeChatId is used to filter incoming push messages
void _activeChatId

export function takePendingNavigation(): Record<string, string> | null {
  const d = _pendingNavigation
  _pendingNavigation = null
  return d
}

// Web — push notifications handled via browser Notification API in usePushNotifications.ts
export async function initPushNotifications(_toast?: Toast): Promise<void> {
  logger.debug('[Push] initPushNotifications — web no-op (browser Notification API used separately)')
}

export async function unregisterPushToken(): Promise<void> {
  const token = localStorage.getItem(PUSH_TOKEN_KEY)
  const jwt = tokenUtils.get()
  localStorage.removeItem(PUSH_TOKEN_KEY)
  if (!token || !jwt) return
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api'
    await fetch(`${apiUrl}/notifications/device-token`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      credentials: 'include',
      body: JSON.stringify({ token }),
    })
  } catch { /* ignoruj */ }
}

