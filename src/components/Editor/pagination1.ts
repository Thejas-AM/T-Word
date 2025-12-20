import { Editor } from '@tiptap/react'
import { TextSelection } from 'prosemirror-state'
import { findSplitOffset } from './extensions/splitParagraph'
import { splitParagraphAcrossPages } from './extensions/splitParagraphCommand'

const PAGE_HEIGHT = 1122 // px for A4 @ 96dpi, adjust if needed
const HEADER_FOOTER_SPACE = 80

let isPaginating = false

// ================= MAIN ENTRY =================
export function autoPaginateFull(editor: Editor) {
  if (!editor || isPaginating) return
  isPaginating = true

  const { from } = editor.state.selection
  const nodeAtCursor = editor.state.doc.nodeAt(from)
  const offsetInNode = from - editor.state.doc.resolve(from).start()

  requestAnimationFrame(() => {
    fullPagination(editor)

    // Restore cursor after reflow
    if (nodeAtCursor) {
      let newPos = findNodePosition(editor, nodeAtCursor)
      if (newPos === null) newPos = editor.state.doc.content.size
      editor.commands.setTextSelection(
        TextSelection.near(editor.state.doc.resolve(newPos + offsetInNode))
      )
    }

    isPaginating = false
  })
}

// ================= FULL PAGINATION =================
function fullPagination(editor: Editor) {
  editor.commands.command(({ tr, state }) => {
    // Collect all blocks in order
    const blocks: { node: any; pos: number }[] = []
    state.doc.descendants((node, pos) => {
      if (node.type.name !== 'page') return
      node.forEach((child, childOffset) => {
        blocks.push({ node: child, pos: pos + childOffset + 1 })
      })
    })

    // Delete all pages except first
    const pages: { node: any; pos: number }[] = []
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') pages.push({ node, pos })
    })
    for (let i = pages.length - 1; i > 0; i--) {
      tr.delete(pages[i].pos, pages[i].pos + pages[i].node.nodeSize)
    }

    // Start first page
    let currentPageHeight = 0
    let pageNode = state.schema.nodes.page.create(null)
    let pageContent: any[] = []

    blocks.forEach(({ node }) => {
      let nodeHeight = estimateNodeHeight(node)
      if (currentPageHeight + nodeHeight > PAGE_HEIGHT - HEADER_FOOTER_SPACE) {
        // Overflow → split if paragraph
        if (node.type.name === 'paragraph') {
          const splitOffset = findSplitOffsetForNode(node, PAGE_HEIGHT - HEADER_FOOTER_SPACE - currentPageHeight)
          if (splitOffset !== null && splitOffset > 0) {
            splitParagraphAcrossPages(editor, -1, -1, splitOffset) // Use existing command
            return
          }
        }
        // Append current page
        if (pageContent.length) {
          const newPage = state.schema.nodes.page.create(null, pageContent)
          tr.insert(tr.doc.content.size, newPage)
        }
        // Reset
        currentPageHeight = 0
        pageContent = []
      }

      pageContent.push(node)
      currentPageHeight += nodeHeight
    })

    // Insert last page
    if (pageContent.length) {
      const newPage = state.schema.nodes.page.create(null, pageContent)
      tr.insert(tr.doc.content.size, newPage)
    }

    return true
  })
}

// ================= HELPER: Node height estimation =================
function estimateNodeHeight(node: any): number {
  // Approximation: use content size for text
  if (node.type.name === 'paragraph') {
    const lineHeight = 20 // px per line, adjust if needed
    const lines = Math.max(1, node.content.size / 40) // rough chars per line
    return lines * lineHeight
  }
  // Other blocks
  return 60 // default for headings, images, etc.
}

// ================= HELPER: Find node position in new doc =================
function findNodePosition(editor: Editor, node: any): number | null {
  let pos: number | null = null
  editor.state.doc.descendants((n, p) => {
    if (n === node) {
      pos = p
      return false
    }
  })
  return pos
}

// ================= HELPER: Approx split offset =================
function findSplitOffsetForNode(node: any, availableHeight: number): number | null {
  // Rough estimation: proportionally split by height
  const totalHeight = estimateNodeHeight(node)
  if (totalHeight <= availableHeight) return null
  const ratio = availableHeight / totalHeight
  const chars = node.content.size
  return Math.floor(chars * ratio)
}
