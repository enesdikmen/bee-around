import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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
  disabled?: boolean
}

function BentoTooltip({
  className,
  ariaLabel,
  panelClassName,
  panel,
  disabled = false,
}: BentoTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const panelRef = useRef<HTMLSpanElement | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  /** Pointer type of the press in progress. A tap is followed by emulated
   *  hover and focus, which must not open the panel before the tap toggles it. */
  const pressTypeRef = useRef<string | null>(null)
  /** Opened by a tap: it stays open until the next tap, not until blur. */
  const [isPinned, setIsPinned] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [portalRoot, setPortalRoot] = useState<Element | null>(null)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current === null) return
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const scheduleClose = () => {
    if (isPinned) return
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

  useLayoutEffect(() => {
    if (!disabled) return
    clearCloseTimer()
    const closeId = window.setTimeout(() => {
      setIsOpen(false)
      setIsPinned(false)
    }, 0)
    return () => window.clearTimeout(closeId)
  }, [disabled])

  // A tapped-open panel closes on a tap anywhere else, including the start of
  // a scroll.
  useEffect(() => {
    if (!isPinned) return
    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setIsOpen(false)
      setIsPinned(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePress, true)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress, true)
  }, [isPinned])

  const openTooltip = () => {
    if (disabled) return
    clearCloseTimer()
    setPortalRoot(
      triggerRef.current?.closest('.app-shell') ??
        (typeof document !== 'undefined' ? document.body : null),
    )
    setIsOpen(true)
  }

  const onHoverStart = (event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse') openTooltip()
  }

  const onHoverEnd = (event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse') scheduleClose()
  }

  const onFocus = () => {
    if (pressTypeRef.current && pressTypeRef.current !== 'mouse') return
    openTooltip()
  }

  const onTap = () => {
    const pressType = pressTypeRef.current
    pressTypeRef.current = null
    if (!pressType || pressType === 'mouse' || disabled) return
    if (isPinned) {
      setIsOpen(false)
      setIsPinned(false)
      return
    }
    openTooltip()
    setIsPinned(true)
  }

  const tooltip =
    isOpen && !disabled && portalRoot
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
          onPointerEnter={onHoverStart}
          onPointerLeave={onHoverEnd}
        >
          {panel}
        </span>,
        portalRoot,
      )
      : null

  return (
    <>
      <span
        ref={triggerRef}
        className={className}
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        onPointerDown={(event) => { pressTypeRef.current = event.pointerType }}
        onPointerCancel={() => { pressTypeRef.current = null }}
        onPointerEnter={onHoverStart}
        onPointerLeave={onHoverEnd}
        onFocus={onFocus}
        onBlur={scheduleClose}
        onClick={onTap}
      />
      {tooltip}
    </>
  )
}

export default BentoTooltip
