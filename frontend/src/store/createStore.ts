import { useSyncExternalStore } from 'react'

/** 화면 여러 곳이 같은 값을 보게 하는 작은 저장소 */
export interface Store<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

export function createStore<T>(initial: T, onFirstSubscribe?: () => void): Store<T> {
  let state = initial
  let started = false
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
      if (Object.is(value, state)) return
      state = value
      listeners.forEach((l) => l())
    },
    subscribe(listener) {
      listeners.add(listener)
      if (!started && onFirstSubscribe) {
        started = true
        onFirstSubscribe()
      }
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get)
}
