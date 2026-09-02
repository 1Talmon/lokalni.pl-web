import { Capacitor, registerPlugin } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { apiClient } from './apiClient'
import { tokenUtils } from '../utils/tokenUtils'
import { logger } from '../utils/logger'

interface FCMTokenPlugin {
  getToken(): Promise<{ token: string }>
  setActiveChatId(options: { id: string }): Promise<void>
}

const FCMToken = registerPlugin<FCMTokenPlugin>('FCMToken')

type WindowWithFCM = Window & typeof globalThis & { __fcmToken?: string }

function platform(): 'ios' | 'android' | null {
  const p = Capacitor.getPlatform()
  if (p === 'ios') return 'ios'
  if (p === 'android') return 'android'
  return null
}

const PUSH_TOKEN_KEY = 'push_device_token'

type Toast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

async function registerToken(token: string, p: 'ios' | 'android') {
  try {
    const res = await apiClient.post('/notifications/device-token', { token, platform: p })
    if (!res.ok) {
      logger.warn('[Push] registerToken HTTP', res.status)
      return
    }
    localStorage.setItem(PUSH_TOKEN_KEY, token)
    logger.info('[Push] token zarejestrowany OK')
  } catch (err) {
    logger.error('[Push] registerToken wyjątek', err)
  }
}

let _pendingNavigation: Record<string, string> | null = null
let _activeChatId: string | null = null

export function setActiveChatId(id: string | null) {
  _activeChatId = id
  FCMToken.setActiveChatId({ id: id ?? '' }).catch(() => {})
}

export function takePendingNavigation(): Record<string, string> | null {
  const d = _pendingNavigation
  _pendingNavigation = null
  return d
}

export async function initPushNotifications(_toast?: Toast): Promise<void> {
  const p = platform()
  if (!p) return

  try {
    let permStatus = await PushNotifications.checkPermissions()

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }

    if (permStatus.receive !== 'granted') {
      logger.info('[Push] brak uprawnień:', permStatus.receive)
      return
    }

    PushNotifications.addListener('pushNotificationReceived', (raw) => {
      const notification = raw as { data?: Record<string, string> }
      const data = notification.data
      // JS-owy backup dla Androida — iOS wycisza przez natywny NotificationInterceptor
      if ((data?.type === 'message' || data?.type === 'like') && data?.sessionId && _activeChatId && data.sessionId === _activeChatId) return
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (raw) => {
      const action = raw as { notification?: { data?: Record<string, string> } }
      const data = action.notification?.data
      if (!data) return
      _pendingNavigation = data
      window.dispatchEvent(new CustomEvent('push:navigate', { detail: data }))
    })

    PushNotifications.addListener('registrationError', (err) => {
      logger.error('[Push] registrationError:', err)
    })

    await PushNotifications.register()

    if (p === 'ios') {
      let registered = false

      const tryRegister = async (token: string) => {
        if (registered) return
        registered = true
        await registerToken(token, p)
      }

      // Szybka ścieżka 1 — token już w window (dispatchFCMTokenToJS z AppDelegate)
      const windowToken = (window as WindowWithFCM).__fcmToken as string | undefined
      if (windowToken) {
        await tryRegister(windowToken)
        return
      }

      // Szybka ścieżka 2 — token w pamięci natywnej przez FCMTokenPlugin
      try {
        const { token: nativeToken } = await FCMToken.getToken()
        if (nativeToken) {
          await tryRegister(nativeToken)
          return
        }
      } catch { /* plugin niedostępny — fallback do pollingu */ }

      // Event od AppDelegate (jeśli JS był gotowy gdy token przyszedł)
      window.addEventListener('fcmTokenReady', async (e) => {
        const token = (e as CustomEvent<{ token: string }>).detail?.token
        if (token) await tryRegister(token)
      }, { once: true })

      // Polling co 1s przez max 30s
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const wt = (window as WindowWithFCM).__fcmToken as string | undefined
        if (wt && !registered) {
          clearInterval(poll)
          await tryRegister(wt)
          return
        }
        try {
          const { token: polled } = await FCMToken.getToken()
          if (polled && !registered) {
            clearInterval(poll)
            await tryRegister(polled)
          }
        } catch { /* ignoruj */ }
        if (attempts >= 30 && !registered) {
          clearInterval(poll)
          logger.warn('[Push] timeout — brak FCM token po 30s')
        }
      }, 1000)
    } else {
      PushNotifications.addListener('registration', async (info: unknown) => {
        const { value } = info as { value: string };
        await registerToken(value, p)
      })
    }

  } catch (err) {
    logger.error('[Push] initPushNotifications wyjątek:', err)
  }
}

export async function unregisterPushToken(): Promise<void> {
  const p = platform()
  if (!p) return
  const token = localStorage.getItem(PUSH_TOKEN_KEY)
  const jwt = tokenUtils.get()
  localStorage.removeItem(PUSH_TOKEN_KEY)
  if (!token || !jwt) return
  try {
    await PushNotifications.removeAllListeners()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api'
    await fetch(`${apiUrl}/notifications/device-token`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      credentials: 'include',
      body: JSON.stringify({ token }),
    })
  } catch { /* ignoruj */ }
}
