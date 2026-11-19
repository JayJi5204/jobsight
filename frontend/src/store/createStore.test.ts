import { describe, expect, it, vi } from 'vitest'

import { createStore } from './createStore'

describe('createStore', () => {
  it('값을 바꾸면 구독자에게 알린다', () => {
    const store = createStore(1)
    const listener = vi.fn()
    store.subscribe(listener)

    store.set(2)
    store.set((prev) => prev + 1)

    expect(store.get()).toBe(3)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('같은 값이면 알리지 않는다', () => {
    const store = createStore('a')
    const listener = vi.fn()
    store.subscribe(listener)

    store.set('a')

    expect(listener).not.toHaveBeenCalled()
  })

  it('구독을 풀면 더 알리지 않는다', () => {
    const store = createStore(0)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.set(1)

    expect(listener).not.toHaveBeenCalled()
  })

  it('첫 구독 때 한 번만 시작한다', () => {
    const start = vi.fn()
    const store = createStore(0, start)

    store.subscribe(() => {})
    store.subscribe(() => {})

    expect(start).toHaveBeenCalledTimes(1)
  })
})
