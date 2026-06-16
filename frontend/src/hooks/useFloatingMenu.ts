import { useCallback, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

const VIEWPORT_PADDING = 8
const GAP = 4
const MIN_MENU_HEIGHT = 80
export const FLOATING_MENU_Z_INDEX = 200

type FloatingMenuPlacement = {
  top: number
  left: number
  minWidth: number
  maxWidth: number
  maxHeight: number
  needsScroll: boolean
}

export function computeFloatingMenuPlacement(
  triggerRect: DOMRect,
  menuScrollHeight: number,
  menuWidth: number,
): FloatingMenuPlacement {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom - VIEWPORT_PADDING)
  const spaceAbove = Math.max(0, triggerRect.top - VIEWPORT_PADDING)

  const fitsBelow = menuScrollHeight <= spaceBelow - GAP
  const fitsAbove = menuScrollHeight <= spaceAbove - GAP
  const openUpward = !fitsBelow && (fitsAbove || spaceAbove > spaceBelow)

  let top: number
  let maxHeight: number

  if (openUpward) {
    maxHeight = Math.max(MIN_MENU_HEIGHT, Math.min(menuScrollHeight, spaceAbove - GAP))
    top = triggerRect.top - GAP - Math.min(menuScrollHeight, maxHeight)
    if (top < VIEWPORT_PADDING) {
      maxHeight = Math.max(MIN_MENU_HEIGHT, triggerRect.top - GAP - VIEWPORT_PADDING)
      top = triggerRect.top - GAP - Math.min(menuScrollHeight, maxHeight)
    }
  } else {
    top = triggerRect.bottom + GAP
    maxHeight = Math.max(MIN_MENU_HEIGHT, Math.min(menuScrollHeight, spaceBelow - GAP))
  }

  let left = triggerRect.left
  const width = Math.max(triggerRect.width, menuWidth)
  if (left + width > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - width - VIEWPORT_PADDING
  }
  left = Math.max(VIEWPORT_PADDING, left)

  return {
    top,
    left,
    minWidth: triggerRect.width,
    maxWidth: viewportWidth - VIEWPORT_PADDING * 2,
    maxHeight,
    needsScroll: menuScrollHeight > maxHeight,
  }
}

export function useFloatingMenu(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
) {
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    visibility: 'hidden',
    zIndex: FLOATING_MENU_Z_INDEX,
  })

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const triggerRect = trigger.getBoundingClientRect()
    const placement = computeFloatingMenuPlacement(
      triggerRect,
      menu.scrollHeight,
      Math.max(menu.offsetWidth, triggerRect.width),
    )

    setMenuStyle({
      position: 'fixed',
      top: placement.top,
      left: placement.left,
      right: 'auto',
      bottom: 'auto',
      minWidth: placement.minWidth,
      maxWidth: placement.maxWidth,
      maxHeight: placement.maxHeight,
      overflowY: placement.needsScroll ? 'auto' : undefined,
      WebkitOverflowScrolling: placement.needsScroll ? 'touch' : undefined,
      zIndex: FLOATING_MENU_Z_INDEX,
      visibility: 'visible',
    })
  }, [triggerRef, menuRef])

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle({
        position: 'fixed',
        top: 0,
        left: 0,
        visibility: 'hidden',
        zIndex: FLOATING_MENU_Z_INDEX,
      })
      return
    }

    let frameId = 0

    const runPositionUpdate = () => {
      if (!triggerRef.current || !menuRef.current) {
        frameId = requestAnimationFrame(runPositionUpdate)
        return
      }
      updatePosition()
    }

    runPositionUpdate()

    const menu = menuRef.current
    const resizeObserver =
      menu && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updatePosition())
        : null

    if (menu) resizeObserver?.observe(menu)

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition, triggerRef, menuRef])

  return menuStyle
}
