/**
 * printPosterToPdf — Track A poster export.
 *
 * Uses the browser's native print pipeline to produce a high-fidelity
 * PDF via the user's "Save as PDF" destination. Text and inline SVG
 * stay vector; only raster images and the WebGL globe canvas are
 * rasterised, at whatever DPI the user picks in the print dialog.
 *
 * Why not html2canvas / jsPDF? Those rasterise the whole poster into
 * a single bitmap, which defeats "high resolution" and chokes on
 * modern CSS (grid, clamp, filters) and CORS-tainted images.
 *
 * Kept deliberately tiny and dependency-free so swapping in Track B
 * (Puppeteer) later doesn't touch the React tree.
 */

export interface PrintPosterOptions {
  /** Grid columns from the packer — used to preserve the poster aspect ratio. */
  gridW: number
  /** Grid rows from the packer — used to preserve the poster aspect ratio. */
  gridH: number
  /** Place name; becomes the suggested PDF filename in Chrome. */
  placeName: string
  /** Optional poster seed retained for compatibility with callers; not shown in filenames. */
  seed?: number
}

/** ISO 216 A3 landscape, in millimetres. */
const PAGE_SIZE_MM = {
  width: 420,
  height: 297,
} as const
/** Minimum visible canvas around the poster grid, matching the screen preview. */
const PAGE_MIN_BACKGROUND_MARGIN_MM = 12

function fitPosterPadding(gridW: number, gridH: number) {
  const ratio = gridW / gridH
  const availableW = PAGE_SIZE_MM.width - PAGE_MIN_BACKGROUND_MARGIN_MM * 2
  const availableH = PAGE_SIZE_MM.height - PAGE_MIN_BACKGROUND_MARGIN_MM * 2
  const availableRatio = availableW / availableH

  if (ratio >= availableRatio) {
    const contentH = availableW / ratio
    return {
      x: PAGE_MIN_BACKGROUND_MARGIN_MM,
      y: (PAGE_SIZE_MM.height - contentH) / 2,
    }
  }

  const contentW = availableH * ratio
  return {
    x: (PAGE_SIZE_MM.width - contentW) / 2,
    y: PAGE_MIN_BACKGROUND_MARGIN_MM,
  }
}

function sanitizeFilename(input: string): string {
  return (
    input
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'poster'
  )
}

/**
 * Trigger the browser print dialog with a true A3 landscape page.
 * The poster grid keeps its aspect ratio and any extra space becomes
 * background canvas, so the PDF remains a standard physical size.
 */
export function printPosterToPdf(opts: PrintPosterOptions): void {
  const { gridW, gridH, placeName } = opts

  const padding = fitPosterPadding(gridW, gridH)

  // Inject (or replace) the dynamic @page rule. Using a dedicated <style>
  // node keeps it isolated from the static print CSS and easy to remove.
  const STYLE_ID = 'bee-around-print-page'
  document.getElementById(STYLE_ID)?.remove()
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.media = 'print'
  style.textContent = `
    @page { size: ${PAGE_SIZE_MM.width}mm ${PAGE_SIZE_MM.height}mm; margin: 0; }
    :root {
      --print-page-padding-x: ${padding.x.toFixed(2)}mm;
      --print-page-padding-y: ${padding.y.toFixed(2)}mm;
    }
  `
  document.head.appendChild(style)

  // Title becomes the default filename in Chrome's Save-as-PDF dialog.
  const prevTitle = document.title
  const filenameBase = sanitizeFilename(`Bee Around - ${placeName}`)
  document.title = filenameBase

  const cleanup = () => {
    document.title = prevTitle
    style.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)

  // Defer one frame so the title change is committed before the dialog opens.
  requestAnimationFrame(() => window.print())
}
