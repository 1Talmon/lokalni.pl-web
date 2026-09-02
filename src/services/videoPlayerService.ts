import { Capacitor, registerPlugin } from '@capacitor/core'

interface VideoPlayerPlugin {
  play(options: { url: string }): Promise<void>
}

const VideoPlayer = registerPlugin<VideoPlayerPlugin>('VideoPlayer')

export function playVideo(url: string): void {
  if (Capacitor.getPlatform() === 'ios') {
    VideoPlayer.play({ url }).catch(() => {})
  } else {
    // Android / web — fallback: otwórz w nowym oknie
    window.open(url, '_blank')
  }
}
