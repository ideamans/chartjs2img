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
