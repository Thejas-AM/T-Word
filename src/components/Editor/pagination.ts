import { Editor } from '@tiptap/react'
import { TextSelection } from 'prosemirror-state'
import { findSplitOffset } from './extensions/splitParagraph'
import { splitParagraphAcrossPages } from './extensions/splitParagraphCommand'

const HEADER_FOOTER_SPACE = 80

// ================= CURSOR PAGE =================
export function getCursorPageIndex(editor: Editor): number {
  const { from } = editor.state.selection
  let index = -1
  let found = false

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'page') {
      index++
      if (from >= pos && from <= pos + node.nodeSize) {
        found = true
        return false
      }
    }
  })

  return found ? index : 0
}

// ================= MAIN ENTRY =================
let isPaginating = false

export function autoPaginate(editor: Editor) {
  if (editor.isDestroyed || isPaginating) return
  
  isPaginating = true

  requestAnimationFrame(() => {
    try {
        const { from } = editor.state.selection
        const pages = document.querySelectorAll('.a4-page')
        if (pages.length === 0) return

        // Check all pages to handle cascading overflows
        for (let i = 0; i < pages.length; i++) {
             // If a page changes, we might need to re-evaluate subsequent pages.
             // But for now, a simple pass should catch immediate overflows.
             // If a block moves from i to i+1, the next iteration (i+1) will check i+1.
             // However, `pages` is a static NodeList (querySelectorAll).
             // If we create a new page, it won't be in `pages`.
             // So we should re-query or handle it. 
             // Since we loop by index, if we add a page, the length of *actual* pages increases.
             // But our `pages` variable is stale.
             
             // Dynamic check:
             const currentPages = document.querySelectorAll('.a4-page')
             if (i >= currentPages.length) break;
             
             const changed = paginateFromPage(editor, i)
             if (!changed) {
               fillUnderflow(editor, i)
             }
        }
        
        // Cleanup empty pages
        removeEmptyPages(editor)
        editor.chain().focus().run()

    } finally {
        isPaginating = false
    }
  })
}

// ================= PAGINATE ONE PAGE =================
function paginateFromPage(editor: Editor, pageIndex: number): boolean {
  const pages = document.querySelectorAll('.a4-page')
  const page = pages[pageIndex] as HTMLElement
  if (!page) return false

  const maxHeight = page.clientHeight - HEADER_FOOTER_SPACE
  const pageTop = page.getBoundingClientRect().top
  
  // Get direct children that are content blocks
  const blocks = Array.from(page.children).filter(
    el =>
      !el.classList.contains('page-header') &&
      !el.classList.contains('page-footer') &&
      !el.hasAttribute('data-page') // Ensure we don't pick up the page itself if nested
  ) as HTMLElement[]

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    
    // Calculate relative bottom position
    const blockRect = block.getBoundingClientRect()
    const relativeBottom = blockRect.bottom - pageTop
    
    // Check if this block pushes past the limit
    if (relativeBottom > maxHeight) {
      resolveOverflow(editor, pageIndex, i, block, maxHeight, pageTop)
      return true 
    }
  }
  return false
}

// ================= FILL UNDERFLOW =================
function fillUnderflow(editor: Editor, pageIndex: number) {
  const pages = document.querySelectorAll('.a4-page')
  const page = pages[pageIndex] as HTMLElement
  const nextPage = pages[pageIndex + 1] as HTMLElement
  if (!page || !nextPage) return

  const maxHeight = page.clientHeight - HEADER_FOOTER_SPACE
  const pageTop = page.getBoundingClientRect().top

  const blocks = Array.from(page.children).filter(
    el =>
      !el.classList.contains('page-header') &&
      !el.classList.contains('page-footer') &&
      !el.hasAttribute('data-page')
  ) as HTMLElement[]

  const lastBlock = blocks[blocks.length - 1]
  const used = lastBlock
    ? lastBlock.getBoundingClientRect().bottom - pageTop
    : 0
  const available = maxHeight - used
  if (available <= 0) return

  const nextBlocks = Array.from(nextPage.children).filter(
    el =>
      !el.classList.contains('page-header') &&
      !el.classList.contains('page-footer') &&
      !el.hasAttribute('data-page')
  ) as HTMLElement[]

  if (nextBlocks.length === 0) return

  const candidate = nextBlocks[0]
  const h = candidate.getBoundingClientRect().height
  if (h <= available) {
    moveBlockUp(editor, pageIndex + 1, 0, pageIndex)
  }
}

// ================= OVERFLOW HANDLER =================
function resolveOverflow(
  editor: Editor,
  pageIndex: number,
  blockIndex: number,
  block: HTMLElement,
  maxHeight: number,
  pageTop: number
) {
  // 1️⃣ Split paragraph (Word behavior)
  if (block.classList.contains('pm-paragraph')) {
    const splitOffset = findSplitOffset(block, maxHeight, pageTop)
    if (splitOffset !== null && splitOffset > 0) {
      splitParagraphAcrossPages(editor, pageIndex, blockIndex, splitOffset)
      return
    }
  }

  // 2️⃣ Move whole block
  moveBlock(editor, pageIndex, blockIndex)
}

// ================= MOVE BLOCK =================
function moveBlock(editor: Editor, pageIndex: number, blockIndex: number) {
  editor.commands.command(({ tr, state }) => {
    const pagePositions: number[] = []

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') pagePositions.push(pos)
    })

    const fromPagePos = pagePositions[pageIndex]
    
    // Find absolute position of the block
    const pageNode = state.doc.nodeAt(fromPagePos)
    if (!pageNode) return false
    
    let foundPos = -1
    let childCount = 0
    pageNode.forEach((child, offset) => {
        if (childCount === blockIndex) {
            foundPos = fromPagePos + 1 + offset
        }
        childCount++
    })
    
    if (foundPos === -1) return false
    
    const node = state.doc.nodeAt(foundPos)
    if (!node) return false

    // If next page exists, use it. Else create it.
    let toPagePos = pagePositions[pageIndex + 1]
    
    if (toPagePos === undefined) {
         // Create new page
         const emptyPara = state.schema.nodes.paragraph.create()
         const newPage = state.schema.nodes.page.create(null, emptyPara)
         tr.insert(state.doc.content.size, newPage)
         toPagePos = state.doc.content.size - newPage.nodeSize // This might be wrong if we just inserted at end.
         // Recalculate toPagePos correctly
         toPagePos = tr.doc.content.size - newPage.nodeSize
    }

    // Move the node
    tr.delete(foundPos, foundPos + node.nodeSize)
    
    // Re-calculate toPagePos because deletion shifted positions?
    // If deletion was BEFORE insertion (it shouldn't be, toPagePos is > foundPos usually),
    // but if we move from Page 1 to Page 2, Page 1 is before Page 2.
    // So foundPos < toPagePos.
    // Deleting at foundPos shifts toPagePos by -node.nodeSize.
    
    let targetPos = toPagePos
    if (foundPos < toPagePos) {
        targetPos -= node.nodeSize
    }
    
    // We want to insert at the START of the target page content
    tr.insert(targetPos + 1, node)

    const $sel = tr.doc.resolve(targetPos + 2)
    tr.setSelection(TextSelection.near($sel))

    return true
  })
}

// ================= MOVE BLOCK UP =================
function moveBlockUp(editor: Editor, fromPageIndex: number, blockIndex: number, toPageIndex: number) {
  editor.commands.command(({ tr, state }) => {
    const pagePositions: number[] = []
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') pagePositions.push(pos)
    })

    const fromPagePos = pagePositions[fromPageIndex]
    const toPagePos = pagePositions[toPageIndex]
    const fromPageNode = state.doc.nodeAt(fromPagePos)
    const toPageNode = state.doc.nodeAt(toPagePos)
    if (!fromPageNode || !toPageNode) return false

    let foundPos = -1
    let idx = 0
    fromPageNode.forEach((child, offset) => {
      if (idx === blockIndex) {
        foundPos = fromPagePos + 1 + offset
      }
      idx++
    })
    if (foundPos === -1) return false

    const node = state.doc.nodeAt(foundPos)
    if (!node) return false

    tr.delete(foundPos, foundPos + node.nodeSize)

    let insertPos = toPagePos + toPageNode.nodeSize - 1
    if (foundPos < insertPos) {
      insertPos -= node.nodeSize
    }
    tr.insert(insertPos, node)
    const $sel = tr.doc.resolve(insertPos + 1)
    tr.setSelection(TextSelection.near($sel))
    return true
  })
}

// ================= REMOVE EMPTY PAGES =================
function removeEmptyPages(editor: Editor) {
    editor.commands.command(({ tr, state }) => {
        let modified = false
        const pages: { pos: number, node: any }[] = []
        state.doc.descendants((node, pos) => {
            if (node.type.name === 'page') {
                pages.push({ pos, node })
            }
        })
        
        let remainingPages = pages.length

        // Iterate backwards
        for (let i = pages.length - 1; i >= 0; i--) {
            const { pos, node } = pages[i]
            
            // Don't remove the only page
            if (remainingPages <= 1) break;
            
            // Check if page is effectively empty (contains only empty paragraph)
            let isEmpty = false
            if (node.childCount === 0) {
                isEmpty = true
            } else if (node.childCount === 1) {
                const child = node.child(0)
                if (child.type.name === 'paragraph' && child.textContent === '') {
                     isEmpty = true
                }
            }
            
            if (isEmpty) {
                 tr.delete(pos, pos + node.nodeSize)
                 modified = true
                 remainingPages--
            }
        }
        return modified
    })
}

function createNextPage(tr: any, state: any) {
  const para = state.schema.nodes.paragraph.create()
  const page = state.schema.nodes.page.create(null, para)
  const pos = tr.doc.content.size
  tr.insert(pos, page)
  return pos
}
