import { useLayoutEffect, useRef } from 'react'

type Props = {
  placeName: string
}

export default function TitlePlaceName({ placeName }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const container = el?.parentElement
    if (!el || !container) return

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        el.style.removeProperty('--title-fit-font-size')
        const availableWidth = container.clientWidth
        const neededWidth = el.scrollWidth
        if (!availableWidth || !neededWidth || neededWidth <= availableWidth) return

        const baseSize = Number.parseFloat(window.getComputedStyle(el).fontSize)
        const fittedSize = Math.max(
          18,
          Math.floor(baseSize * (availableWidth / neededWidth)),
        )
        el.style.setProperty('--title-fit-font-size', `${fittedSize}px`)
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    document.fonts?.ready.then(measure).catch(() => undefined)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [placeName])

  return (
    <span ref={ref} className="bento-title__place">
      {placeName}
    </span>
  )
}
