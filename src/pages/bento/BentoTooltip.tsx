import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type TooltipPosition = {
  left: number
  top: number
  placement: 'above' | 'below'
}

type BentoTooltipProps = {
  className: string
  ariaLabel: string
  panelClassName: string
  panel: ReactNode
}

function BentoTooltip({
  className,
  ariaLabel,
  panelClassName,
  panel,
}: BentoTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const panelRef = useRef<HTMLSpanElement | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current === null) return
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false)
      closeTimerRef.current = null
    }, 90)
  }

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const panelEl = panelRef.current
    if (!trigger || !panelEl) return

    const gap = 7
    const edge = 10
    const triggerRect = trigger.getBoundingClientRect()
    const panelRect = panelEl.getBoundingClientRect()
    const fitsAbove = triggerRect.top >= panelRect.height + gap + edge
    const placement = fitsAbove ? 'above' : 'below'
    const top = placement === 'above'
      ? triggerRect.top - panelRect.height - gap
      : triggerRect.bottom + gap
    const preferredLeft = triggerRect.left + 6
    const left = Math.min(
      Math.max(edge, preferredLeft),
      Math.max(edge, window.innerWidth - panelRect.width - edge),
    )

    setPosition({ left, top: Math.max(edge, top), placement })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, updatePosition])

  useLayoutEffect(() => () => clearCloseTimer(), [])

  const openTooltip = () => {
    clearCloseTimer()
    setIsOpen(true)
  }

  const tooltip =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
        <span
          ref={panelRef}
          className={`bento-tooltip-portal ${panelClassName}`}
          role="tooltip"
          data-placement={position?.placement ?? 'above'}
          style={{
            left: position?.left ?? -9999,
            top: position?.top ?? -9999,
            visibility: position ? 'visible' : 'hidden',
          }}
          onMouseEnter={openTooltip}
          onMouseLeave={scheduleClose}
        >
          {panel}
        </span>,
        triggerRef.current?.closest('.app-shell') ?? document.body,
      )
      : null

  return (
    <>
      <span
        ref={triggerRef}
        className={className}
        tabIndex={0}
        aria-label={ariaLabel}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        onFocus={openTooltip}
        onBlur={scheduleClose}
      />
      {tooltip}
    </>
  )
}

export default BentoTooltip
