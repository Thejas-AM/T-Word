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

const getCursorPosition1 = (editor: Editor): number => {
  if (!editor) return 0;

  const { from, to } = editor.state.selection;

  const pages = document.querySelectorAll('.a4-page')
  const page = pages[0] as HTMLElement
  if (!page) return 0

  const maxHeight = page.clientHeight - HEADER_FOOTER_SPACE
  // If from === to, it's a caret position
  return Math.floor(from / maxHeight );
};

// ================= MAIN ENTRY =================
export function autoPaginate(editor: Editor) {
  if (editor.isDestroyed) return

  requestAnimationFrame(() => {
    const cursorPageIndex = getCursorPosition1(editor)
    console.log("cursorPageIndex",getCursorPosition1(editor))
    paginateFromPage(editor, cursorPageIndex)
  })
}

// ================= PAGINATE ONE PAGE =================
function paginateFromPage(editor: Editor, pageIndex: number) {
  const pages = document.querySelectorAll('.a4-page')
  const page = pages[pageIndex] as HTMLElement
  if (!page) return

  const maxHeight = page.clientHeight - HEADER_FOOTER_SPACE
  const blocks = Array.from(page.children).filter(
    el =>
      !el.classList.contains('page-header') &&
      !el.classList.contains('page-footer')
  ) as HTMLElement[]

  let usedHeight = 0

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    usedHeight += block.offsetHeight

    if (usedHeight > maxHeight) {
      resolveOverflow(editor, pageIndex, i, block, maxHeight)
      return // 🔑 stop after first fix
    }
  }
}

// ================= OVERFLOW HANDLER =================
function resolveOverflow(
  editor: Editor,
  pageIndex: number,
  blockIndex: number,
  block: HTMLElement,
  maxHeight: number
) {
  // 1️⃣ Split paragraph (Word behavior)
  if (block.tagName === 'P') {
    const splitOffset = findSplitOffset(block, maxHeight)
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
    const toPagePos =
      pagePositions[pageIndex + 1] ?? createNextPage(tr, state)

    let nodePos = fromPagePos + 1
    for (let i = 0; i < blockIndex; i++) {
      const n = state.doc.nodeAt(nodePos)
      if (!n) return false
      nodePos += n.nodeSize
    }

    const node = state.doc.nodeAt(nodePos)
    if (!node) return false

    tr.delete(nodePos, nodePos + node.nodeSize)
    tr.insert(toPagePos + 1, node)

    tr.setSelection(
      TextSelection.near(tr.doc.resolve(toPagePos + 2))
    )

    return true
  })
}

// ================= CREATE PAGE =================
function createNextPage(tr: any, state: any) {
  const para = state.schema.nodes.paragraph.create()
  const page = state.schema.nodes.page.create(null, para)
  const pos = tr.doc.content.size
  tr.insert(pos, page)
  return pos
}
