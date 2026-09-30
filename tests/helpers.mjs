import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Compile a self-contained API module with the project's existing compiler.
// A fresh module per test isolates its caches and timers without test-only
// exports, new dependencies, or calls to the real services.
export async function moduleLoader(path) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  let moduleId = 0
  return () => import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}#${moduleId++}`)
}

export function virtualClock(t) {
  let now = 0
  let timerId = 0
  const timers = new Map()
  t.mock.method(Date, 'now', () => now)
  t.mock.method(Math, 'random', () => 0)
  t.mock.method(globalThis, 'setTimeout', (fn, delay = 0) => {
    const id = ++timerId
    timers.set(id, { fn, at: now + delay })
    return id
  })
  t.mock.method(globalThis, 'clearTimeout', (id) => timers.delete(id))
  const flush = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve()
  }
  return {
    now: () => now,
    flush,
    async advance(ms) {
      const target = now + ms
      await flush()
      for (;;) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0]
        if (!next || next[1].at > target) break
        now = next[1].at
        timers.delete(next[0])
        next[1].fn()
        await flush()
      }
      now = target
      await flush()
    },
  }
}

export const response = (status, data = {}, retryAfter) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers(retryAfter === undefined ? {} : { 'Retry-After': retryAfter }),
  json: async () => structuredClone(data),
})
