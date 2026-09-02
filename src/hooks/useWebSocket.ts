/**
 * useWebSocket — połączenie WebSocket z backendem MyLokalni.pl
 *
 * Funkcje:
 * - Auto-connect po zalogowaniu, disconnect po wylogowaniu
 * - Auto-reconnect z exponential backoff (max 30s)
 * - Ping/pong keepalive
 * - Dispatch zdarzeń do React Query (invalidacje)
 * - Typing indicator
 */

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { refreshAccessToken } from '../services/apiClient'

const WS_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:')
      .replace(/\/api$/, '')
  : 'wss://api.mylokalni.pl'

const MAX_RECONNECT_DELAY_MS = 30_000
const INITIAL_RECONNECT_DELAY_MS = 1_000

export type WsEventType =
  | 'new_message'
  | 'message_read'
  | 'message_deleted'
  | 'notification'
  | 'counter_update'
  | 'booking_update'
  | 'typing'
  | 'online_status'
  | 'pong'
  | 'token_expiring'
  | 'auth_ok'
  | 'message_reaction'
  | 'support_message'

export interface WsEvent {
  type: WsEventType
  payload: Record<string, unknown>
}

type WsEventHandler = (event: WsEvent) => void

// Globalny singleton — jeden WS na całą aplikację
let globalWs: WebSocket | null = null
const globalListeners: Set<WsEventHandler> = new Set()
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = INITIAL_RECONNECT_DELAY_MS
let currentToken: string | null = null
let shouldConnect = false
let pingTimer: ReturnType<typeof setInterval> | null = null
// Czy auth_ok już potwierdzony po ostatnim onopen — blokuje ping i typing przed auth
let wsAuthed = false

function dispatchToListeners(event: WsEvent) {
  globalListeners.forEach(fn => fn(event))
}

function clearPingTimer() {
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
}

function startPingTimer() {
  clearPingTimer()
  pingTimer = setInterval(() => {
    if (globalWs?.readyState === WebSocket.OPEN && wsAuthed) {
      globalWs.send(JSON.stringify({ type: 'ping' }))
    }
  }, 25_000)
}

function connect() {
  if (!shouldConnect || !currentToken) return
  if (globalWs && (globalWs.readyState === WebSocket.CONNECTING || globalWs.readyState === WebSocket.OPEN)) return

  // Token NIE jest w URL — wysyłamy jako pierwszą wiadomość po onopen
  const url = `${WS_BASE}/api/ws`
  const ws = new WebSocket(url)
  globalWs = ws
  wsAuthed = false

  ws.onopen = () => {
    reconnectDelay = INITIAL_RECONNECT_DELAY_MS
    // Pierwsza wiadomość musi być auth — serwer zamknie połączenie po 10s bez niej
    ws.send(JSON.stringify({ type: 'auth', token: currentToken }))
    startPingTimer()
  }

  ws.onmessage = (e: MessageEvent) => {
    try {
      const event: WsEvent = JSON.parse(e.data)
      if (event.type === 'auth_ok') {
        wsAuthed = true
      }
      dispatchToListeners(event)
    } catch {
      // ignoruj nieprawidłowy JSON
    }
  }

  ws.onclose = (closeEvent: CloseEvent) => {
    clearPingTimer()
    wsAuthed = false
    globalWs = null
    if (!shouldConnect) return
    // 4001 = Auth timeout/failure — nie reconnectuj natychmiast (token mógł wygasnąć)
    if (closeEvent.code === 4001) {
      reconnectDelay = MAX_RECONNECT_DELAY_MS
    }
    // Exponential backoff reconnect
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
      connect()
    }, reconnectDelay)
  }

  ws.onerror = () => {
    // onclose wywoła się po onerror — reconnect tam
    ws.close()
  }
}

function disconnect() {
  shouldConnect = false
  clearPingTimer()
  wsAuthed = false
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (globalWs) { globalWs.close(); globalWs = null }
  reconnectDelay = INITIAL_RECONNECT_DELAY_MS
}

// Silent refresh + WS re-auth bez rozłączania połączenia
async function silentRefreshAndReauth() {
  try {
    const newToken = await refreshAccessToken()
    if (newToken) {
      currentToken = newToken
      if (globalWs?.readyState === WebSocket.OPEN) {
        globalWs.send(JSON.stringify({ type: 'auth', token: newToken }))
      }
    }
  } catch {
    // cicha porażka — WS pozostanie aktywne do naturalnego wygaśnięcia
  }
}

/**
 * Wyślij typing indicator do serwera.
 */
export function sendTyping(sessionId: string, isTyping: boolean) {
  if (globalWs?.readyState === WebSocket.OPEN && wsAuthed) {
    globalWs.send(JSON.stringify({ type: 'typing', sessionId, isTyping }))
  }
}

export function isWsConnected(): boolean {
  return globalWs?.readyState === WebSocket.OPEN
}

/**
 * Główny hook — podpina WebSocket do React Query.
 * Montuj raz w useAppLogic.
 */
export function useWebSocket(isLoggedIn: boolean, token: string | null) {
  const queryClient = useQueryClient()
  const handlersRef = useRef<WsEventHandler | null>(null)

  const handleEvent = useCallback((event: WsEvent) => {
    switch (event.type) {

      case 'new_message': {
        const { sessionId } = event.payload as { sessionId: string }
        // Dodaj wiadomość natychmiast do cache zamiast czekać na refetch
        queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] })
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        break
      }

      case 'message_read': {
        const { sessionId } = event.payload as { sessionId: string }
        queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] })
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        break
      }

      case 'message_deleted': {
        const { sessionId } = event.payload as { sessionId: string }
        queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] })
        break
      }

      case 'counter_update': {
        const { unreadMessages, unreadNotifications, notificationId, trigger, servicePublicId } = event.payload as {
          unreadMessages?: number
          unreadNotifications?: number
          notificationId?: number
          trigger?: string
          servicePublicId?: string
        }
        // Absolutne wartości z serwera — ustaw wprost zamiast inkrementować
        queryClient.setQueryData(['notification-counts'], (old: { unreadMessages?: number; unreadNotifications?: number } | undefined) => ({
          unreadMessages: unreadMessages ?? old?.unreadMessages ?? 0,
          unreadNotifications: unreadNotifications ?? old?.unreadNotifications ?? 0,
        }))
        // Odśwież listę gdy pojawiło się nowe powiadomienie lub zmieniła się liczba nieprzeczytanych
        if ((notificationId !== null && notificationId !== undefined) || (unreadNotifications !== null && unreadNotifications !== undefined)) {
          queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
        }
        // Nowa opinia — przelicz rating w dashboardzie i na profilu wykonawcy
        if (trigger === 'review') {
          queryClient.invalidateQueries({ queryKey: ['my-analytics'] })
          queryClient.invalidateQueries({ queryKey: ['my-services'] })
          if (servicePublicId) {
            queryClient.invalidateQueries({ queryKey: ['service-reviews', servicePublicId] })
          }
        }
        break
      }

      case 'notification': {
        queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
        queryClient.invalidateQueries({ queryKey: ['notification-counts'] })
        break
      }

      case 'booking_update': {
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] })
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        queryClient.invalidateQueries({ queryKey: ['my-analytics'] })
        queryClient.invalidateQueries({ queryKey: ['my-earnings'] })
        break
      }

      case 'support_message': {
        const { ticketId } = event.payload as { ticketId: string }
        queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
        break
      }

      case 'token_expiring': {
        // Serwer ostrzega 60s przed wygaśnięciem accessToken — odśwież cicho
        silentRefreshAndReauth()
        break
      }

      // typing, pong, auth_ok — obsługiwane przez komponenty lub ignorowane
      default:
        break
    }
  }, [queryClient])

  useEffect(() => {
    handlersRef.current = handleEvent
  }, [handleEvent])

  useEffect(() => {
    if (isLoggedIn && token) {
      // Token available (either fresh login or after startup silent refresh)
      currentToken = token
      shouldConnect = true
      connect()
    } else if (!isLoggedIn) {
      disconnect()
    }
    // isLoggedIn && !token: startup restore in progress — wait for token

    const handler: WsEventHandler = (e) => handlersRef.current?.(e)
    globalListeners.add(handler)

    return () => {
      globalListeners.delete(handler)
    }
  }, [isLoggedIn, token])
}

/**
 * Hook do subskrypcji konkretnych zdarzeń WS w komponentach.
 * Np. typing indicator w ChatModal.
 */
export function useWsEvent(type: WsEventType, handler: (payload: Record<string, unknown>) => void) {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler }, [handler])

  useEffect(() => {
    const listener: WsEventHandler = (event) => {
      if (event.type === type) handlerRef.current(event.payload)
    }
    globalListeners.add(listener)
    return () => { globalListeners.delete(listener) }
  }, [type])
}
