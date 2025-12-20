import { Editor } from '@tiptap/react'
import { TextSelection } from 'prosemirror-state'
import { findSplitOffset } from './extensions/splitParagraph'
import { splitParagraphAcrossPages } from './extensions/splitParagraphCommand'

const HEADER_FOOTER_SPACE = 80
let isPaginating = false

// ---------- STEP 1A: Find cursor page ----------
function getCursorPageIndex(editor: Editor): number {
  const { from } = editor.state.selection
  let index = -1

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'page') {
      index++
      if (pos <= from && from <= pos + node.nodeSize) {
        return false
      }
    }
  })

  return Math.max(0, index)
}

// ---------- STEP 1B: Detect empty page ----------
function isPageEmpty(pageNode: any) {
  return (
    pageNode.childCount === 1 &&
    pageNode.firstChild?.type.name === 'paragraph' &&
    pageNode.firstChild.content.size === 0
  )
}

// ---------- STEP 1C: MAIN PAGINATION ----------
export function autoPaginate(editor: Editor) {
  if (isPaginating) return
  isPaginating = true

  requestAnimationFrame(() => {
    const cursorPageIndex = getCursorPageIndex(editor)
    const pages = document.querySelectorAll('.a4-page')

    pages.forEach((page, pageIndex) => {
      // ✅ DO NOT touch pages above cursor
      if (pageIndex < cursorPageIndex) return
        console.log("cursorPageIndex",cursorPageIndex)
      const maxHeight = page.clientHeight - HEADER_FOOTER_SPACE
      let usedHeight = 0

      const blocks = Array.from(page.children).filter(
        el =>
          !el.classList.contains('page-header') &&
          !el.classList.contains('page-footer')
      )

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i] as HTMLElement
            usedHeight += block.offsetHeight
            console.log(usedHeight,i)
            if (usedHeight > maxHeight) {
                // if (block.tagName === 'P') {
                //     const splitOffset = findSplitOffset(block, maxHeight)

                //     if (splitOffset !== null) {
                //         splitParagraphAcrossPages(
                //             editor,
                //             pageIndex,
                //             i,
                //             splitOffset
                //         )
                //         return
                //     }
                // }

                moveBlock(editor, pageIndex, i)
                break
            }
        }
    })

    cleanupEmptyPages(editor)
    isPaginating = false
  })
}

// ---------- STEP 1D: MOVE BLOCK ----------
function moveBlock(editor: Editor, pageIndex: number, blockIndex: number) {
  editor.commands.command(({ tr, state }) => {
    const pagePositions: number[] = []

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') {
        pagePositions.push(pos)
      }
    })

    const currentPagePos = pagePositions[pageIndex]
    const nextPagePos = pagePositions[pageIndex + 1]

    // ✅ Always create next page with paragraph
    if (nextPagePos === undefined) {
      const paragraph = state.schema.nodes.paragraph.create()
      const pageNode = state.schema.nodes.page.create(null, paragraph)
      tr.insert(state.doc.content.size, pageNode)
    }

    // Find overflowing block position
    let targetPos = currentPagePos + 1
    for (let i = 0; i < blockIndex; i++) {
      const node = state.doc.nodeAt(targetPos)
      if (!node) break
      targetPos += node.nodeSize
    }

    const node = state.doc.nodeAt(targetPos)
    if (!node) return false

    tr.delete(targetPos, targetPos + node.nodeSize)

    const insertPos =
      pagePositions[pageIndex + 1] !== undefined
        ? pagePositions[pageIndex + 1] + 1
        : tr.doc.content.size - 1

    tr.insert(insertPos, node)

    // ✅ PLACE CURSOR SAFELY
    const $pos = tr.doc.resolve(insertPos + 1)
    tr.setSelection(TextSelection.near($pos))

    return true
  })
}

// ---------- STEP 1E: DELETE EMPTY PAGES ----------
function cleanupEmptyPages(editor: Editor) {
  editor.commands.command(({ tr, state }) => {
    const pages: { node: any; pos: number }[] = []

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') {
        pages.push({ node, pos })
      }
    })

    for (let i = pages.length - 1; i > 0; i--) {
      const { node, pos } = pages[i]
      const { from } = state.selection

      // ❌ Don't delete page with cursor
      if (from >= pos && from <= pos + node.nodeSize) continue

      if (isPageEmpty(node)) {
        tr.delete(pos, pos + node.nodeSize)
      }
    }

    return true
  })
}
