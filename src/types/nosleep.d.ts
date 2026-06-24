declare module 'nosleep.js' {
  export default class NoSleep {
    constructor()
    enable(): Promise<void> | void
    disable(): void
    isEnabled: boolean
  }
}
