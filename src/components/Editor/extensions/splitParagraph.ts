export function findSplitOffset(
  paragraphEl: HTMLElement,
  maxHeight: number,
  pageTop: number
): number | null {
  const range = document.createRange()
  const walker = document.createTreeWalker(
    paragraphEl,
    NodeFilter.SHOW_TEXT
  )

  let textNode: Text | null
  let offset = 0

  while ((textNode = walker.nextNode() as Text | null)) {
    for (let i = 1; i <= textNode.length; i++) {
      range.setStart(textNode, 0)
      range.setEnd(textNode, i)

      const rects = range.getClientRects()
      if (!rects.length) continue

      const lastRect = rects[rects.length - 1]
      // Check if the bottom of the text line exceeds the allowed height relative to the page top
      if (lastRect.bottom - pageTop > maxHeight) {
        return offset + i - 1
      }
    }
    offset += textNode.length
  }

  return null
}
