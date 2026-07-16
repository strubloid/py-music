import 'react'

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

export {}
