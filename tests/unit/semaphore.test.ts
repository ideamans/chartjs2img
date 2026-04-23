// Semaphore contract: honors max concurrency, queues beyond it,
// releases wake queued acquirers in FIFO order, and refuses to go
// negative on mismatched acquire/release (defensive guard).
import { describe, test, expect } from 'bun:test'
import { Semaphore } from '../../src/semaphore'

describe('Semaphore', () => {
  test('acquire up to max does not block', async () => {
    const s = new Semaphore(3)
    await s.acquire()
    await s.acquire()
    await s.acquire()
    expect(s.active).toBe(3)
    expect(s.pending).toBe(0)
  })

  test('acquire beyond max queues; release unblocks in order', async () => {
    const s = new Semaphore(2)
    await s.acquire()
    await s.acquire()
    expect(s.active).toBe(2)

    const order: string[] = []
    const p1 = s.acquire().then(() => order.push('a'))
    const p2 = s.acquire().then(() => order.push('b'))
    // queued
    expect(s.pending).toBe(2)

    s.release()
    await p1
    expect(order).toEqual(['a'])
    expect(s.pending).toBe(1)

    s.release()
    await p2
    expect(order).toEqual(['a', 'b'])
    expect(s.pending).toBe(0)
  })

  test('release() with no active holders is a no-op (no negative active)', () => {
    const s = new Semaphore(2)
    // Swallow the expected console.warn.
    const origWarn = console.warn
    let warned = false
    console.warn = (...args: unknown[]) => {
      warned = true
      void args
    }
    try {
      s.release()
      expect(s.active).toBe(0)
      expect(warned).toBe(true)
    } finally {
      console.warn = origWarn
    }
  })

  test('acquire / release balance preserves invariants under contention', async () => {
    const s = new Semaphore(3)
    const N = 20
    let concurrent = 0
    let maxSeen = 0
    const tasks = Array.from({ length: N }, async () => {
      await s.acquire()
      try {
        concurrent++
        if (concurrent > maxSeen) maxSeen = concurrent
        await new Promise((r) => setTimeout(r, 5))
        concurrent--
      } finally {
        s.release()
      }
    })
    await Promise.all(tasks)
    expect(maxSeen).toBeLessThanOrEqual(3)
    expect(s.active).toBe(0)
    expect(s.pending).toBe(0)
  })
})
