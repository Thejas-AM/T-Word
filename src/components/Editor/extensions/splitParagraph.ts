/**
 * Finds the text offset at which a paragraph should be split
 * to prevent overflow past maxHeight from pageTop.
 * 
 * Returns the offset in terms of ProseMirror text content (not DOM nodes).
 */
export function findSplitOffset(
  paragraphEl: HTMLElement,
  maxHeight: number,
  pageTop: number
): number | null {
  const range = document.createRange()

  // Walk through all text nodes in the paragraph
  const walker = document.createTreeWalker(
    paragraphEl,
    NodeFilter.SHOW_TEXT
  )

  let textNode: Text | null
  let proseMirrorOffset = 0  // Tracks offset in ProseMirror terms

  while ((textNode = walker.nextNode() as Text | null)) {
    // For each character in this text node
    for (let i = 1; i <= textNode.length; i++) {
      range.setStart(textNode, 0)
      range.setEnd(textNode, i)

      const rects = range.getClientRects()
      if (!rects.length) continue

      // Get the bottom of the last line of this range
      const lastRect = rects[rects.length - 1]

      // Check if this character causes overflow
      if (lastRect.bottom - pageTop > maxHeight) {
        // Return the offset BEFORE this character
        // We want to keep everything before this point on the current page
        const splitPoint = proseMirrorOffset + i - 1

        // Don't split at position 0 - would create empty paragraph
        if (splitPoint <= 0) return null

        return splitPoint
      }
    }
    proseMirrorOffset += textNode.length
  }

  // No overflow found within this paragraph
  return null
}

/**
 * Maps a DOM text offset to the corresponding ProseMirror position within a node.
 * This handles the case where marks create nested DOM elements.
 */
export function mapDomOffsetToProseMirror(
  domElement: HTMLElement,
  targetOffset: number
): number {
  const walker = document.createTreeWalker(
    domElement,
    NodeFilter.SHOW_TEXT
  )

  let textNode: Text | null
  let domOffset = 0
  let pmOffset = 0

  while ((textNode = walker.nextNode() as Text | null)) {
    if (domOffset + textNode.length >= targetOffset) {
      // Target is within this text node
      return pmOffset + (targetOffset - domOffset)
    }
    domOffset += textNode.length
    pmOffset += textNode.length
  }

  return pmOffset
}
