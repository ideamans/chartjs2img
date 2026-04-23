/** Simple async semaphore for concurrency control */
export class Semaphore {
  private queue: Array<() => void> = []
  private running = 0

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++
      return
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.running++
        resolve()
      })
    })
  }

  release(): void {
    if (this.running <= 0) {
      // release() was called more times than acquire() — always a bug
      // in the caller's try/finally pairing. Refuse to go negative
      // (which would silently break the max-concurrency invariant) and
      // surface the mistake instead.
      console.warn('[semaphore] release() called with no active holders — mismatched acquire/release in caller')
      return
    }
    this.running--
    const next = this.queue.shift()
    if (next) next()
  }

  get pending(): number {
    return this.queue.length
  }

  get active(): number {
    return this.running
  }
}
