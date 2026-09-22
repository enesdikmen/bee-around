// GoatCounter is loaded from index.html. It is absent in local dev, in builds
// published before a site code was configured, and whenever a visitor blocks
// analytics — so every call here is best-effort and must never throw into app
// code.

type GoatCounter = {
  count?: (vars: { path: string; title?: string; event?: boolean }) => void
}

const goatcounter = () =>
  (window as unknown as { goatcounter?: GoatCounter }).goatcounter

// GoatCounter stores an event under a path, so keep it short and grouped by a
// prefix ("error/...") to keep the dashboard readable.
export function countEvent(path: string, title?: string) {
  try {
    goatcounter()?.count?.({ path: path.slice(0, 200), title, event: true })
  } catch {
    // Analytics is never worth breaking a page over.
  }
}
