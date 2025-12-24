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
      const pages = document.querySelectorAll('.a4-page')
      if (pages.length === 0) {
        isPaginating = false
        return
      }

      // Keep iterating until no changes are made (handles cascading overflows)
      let maxIterations = 20 // Prevent infinite loops
      let changed = true

      while (changed && maxIterations > 0) {
        changed = false
        maxIterations--

        // Re-query pages after each iteration since DOM may have changed
        const currentPages = document.querySelectorAll('.a4-page')

        for (let i = 0; i < currentPages.length; i++) {
          if (paginateFromPage(editor, i)) {
            changed = true
            break // Restart from beginning after a change
          }
        }

        if (!changed) {
          // Try fill underflow
          for (let i = 0; i < currentPages.length - 1; i++) {
            if (fillUnderflow(editor, i)) {
              changed = true
              break
            }
          }
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
      !el.hasAttribute('data-page')
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
function fillUnderflow(editor: Editor, pageIndex: number): boolean {
  const pages = document.querySelectorAll('.a4-page')
  const page = pages[pageIndex] as HTMLElement
  const nextPage = pages[pageIndex + 1] as HTMLElement
  if (!page || !nextPage) return false

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
  if (available <= 20) return false // Need at least 20px margin

  const nextBlocks = Array.from(nextPage.children).filter(
    el =>
      !el.classList.contains('page-header') &&
      !el.classList.contains('page-footer') &&
      !el.hasAttribute('data-page')
  ) as HTMLElement[]

  if (nextBlocks.length === 0) return false

  const candidate = nextBlocks[0]
  const h = candidate.getBoundingClientRect().height
  if (h <= available) {
    moveBlockUp(editor, pageIndex + 1, 0, pageIndex)
    return true
  }
  return false
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
  // 1️⃣ Try to split paragraph (Word behavior)
  if (block.classList.contains('pm-paragraph')) {
    const splitOffset = findSplitOffset(block, maxHeight, pageTop)
    if (splitOffset !== null && splitOffset > 0) {
      splitParagraphAcrossPages(editor, pageIndex, blockIndex, splitOffset)
      return
    }
  }

  // 2️⃣ Move whole block to next page
  moveBlock(editor, pageIndex, blockIndex)
}

// ================= MOVE BLOCK TO NEXT PAGE =================
function moveBlock(editor: Editor, pageIndex: number, blockIndex: number) {
  editor.commands.command(({ tr, state }) => {
    // Find all page positions
    const pagePositions: number[] = []
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') pagePositions.push(pos)
    })

    const fromPagePos = pagePositions[pageIndex]
    if (fromPagePos === undefined) return false

    // Find the block position within the page
    const pageNode = state.doc.nodeAt(fromPagePos)
    if (!pageNode) return false

    let blockPos = -1
    let idx = 0
    pageNode.forEach((child, offset) => {
      if (idx === blockIndex) {
        blockPos = fromPagePos + 1 + offset
      }
      idx++
    })

    if (blockPos === -1) return false

    const node = state.doc.nodeAt(blockPos)
    if (!node) return false

    // Check if next page exists
    let nextPagePos = pagePositions[pageIndex + 1]
    let createdNewPage = false

    if (nextPagePos === undefined) {
      // Create new page at the end of document
      const emptyPara = state.schema.nodes.paragraph.create()
      const newPage = state.schema.nodes.page.create(null, emptyPara)
      const insertPos = state.doc.content.size
      tr.insert(insertPos, newPage)
      nextPagePos = insertPos
      createdNewPage = true
    }

    // Delete the block from current page
    tr.delete(blockPos, blockPos + node.nodeSize)

    // Adjust nextPagePos if deletion was before it
    let adjustedNextPagePos = nextPagePos
    if (!createdNewPage && blockPos < nextPagePos) {
      adjustedNextPagePos -= node.nodeSize
    }

    // Insert at the START of the next page's content
    const insertPos = adjustedNextPagePos + 1
    tr.insert(insertPos, node)

    // Position cursor in the moved block
    const $sel = tr.doc.resolve(insertPos + 1)
    tr.setSelection(TextSelection.near($sel))

    return true
  })
}

// ================= MOVE BLOCK UP TO PREVIOUS PAGE =================
function moveBlockUp(editor: Editor, fromPageIndex: number, blockIndex: number, toPageIndex: number) {
  editor.commands.command(({ tr, state }) => {
    const pagePositions: number[] = []
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') pagePositions.push(pos)
    })

    const fromPagePos = pagePositions[fromPageIndex]
    const toPagePos = pagePositions[toPageIndex]
    if (fromPagePos === undefined || toPagePos === undefined) return false

    const fromPageNode = state.doc.nodeAt(fromPagePos)
    const toPageNode = state.doc.nodeAt(toPagePos)
    if (!fromPageNode || !toPageNode) return false

    // Find the block position
    let blockPos = -1
    let idx = 0
    fromPageNode.forEach((child, offset) => {
      if (idx === blockIndex) {
        blockPos = fromPagePos + 1 + offset
      }
      idx++
    })
    if (blockPos === -1) return false

    const node = state.doc.nodeAt(blockPos)
    if (!node) return false

    // Delete from source page
    tr.delete(blockPos, blockPos + node.nodeSize)

    // Calculate insert position at the END of the target page's content
    // toPageNode.nodeSize includes the opening and closing tags (+2)
    // So content ends at toPagePos + toPageNode.nodeSize - 1
    let insertPos = toPagePos + toPageNode.nodeSize - 1

    // Adjust if deletion was before insert position
    if (blockPos < insertPos) {
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

    // Don't remove if only one page
    if (pages.length <= 1) return false

    // Iterate backwards to handle position shifts correctly
    for (let i = pages.length - 1; i >= 0; i--) {
      const { pos, node } = pages[i]

      // Always keep at least one page
      if (pages.length - (modified ? 1 : 0) <= 1) break

      // Check if page is effectively empty
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
        // Map position to account for previous deletions
        const mappedPos = tr.mapping.map(pos)
        const mappedNode = tr.doc.nodeAt(mappedPos)
        if (mappedNode && mappedNode.type.name === 'page') {
          tr.delete(mappedPos, mappedPos + mappedNode.nodeSize)
          modified = true
        }
      }
    }
    return modified
  })
}
