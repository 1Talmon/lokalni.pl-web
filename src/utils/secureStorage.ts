import { Capacitor } from '@capacitor/core'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

const KEY = 'lokalni_rt'
const isNative = Capacitor.isNativePlatform()

export const secureStorage = {
  async setRefreshToken(token: string): Promise<void> {
    if (!isNative) return
    await SecureStoragePlugin.set({ key: KEY, value: token })
  },
  async getRefreshToken(): Promise<string | null> {
    if (!isNative) return null
    try {
      const { value } = await SecureStoragePlugin.get({ key: KEY })
      return value ?? null
    } catch {
      return null
    }
  },
  async removeRefreshToken(): Promise<void> {
    if (!isNative) return
    try { await SecureStoragePlugin.remove({ key: KEY }) } catch { /* best-effort */ }
  },
}
