import { Editor } from '@tiptap/react'
import { TextSelection } from 'prosemirror-state'

export function splitParagraphAcrossPages(
  editor: Editor,
  pageIndex: number,
  blockIndex: number,
  splitOffset: number
) {
  editor.commands.command(({ tr, state }) => {
    // Find all page positions
    const pagePositions: number[] = []
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') pagePositions.push(pos)
    })

    const pagePos = pagePositions[pageIndex]
    if (pagePos === undefined) return false

    // Find the block position within the page
    const pageNode = state.doc.nodeAt(pagePos)
    if (!pageNode) return false

    let blockPos = pagePos + 1
    for (let i = 0; i < blockIndex; i++) {
      const n = state.doc.nodeAt(blockPos)
      if (!n) return false
      blockPos += n.nodeSize
    }

    const para = state.doc.nodeAt(blockPos)
    if (!para || para.type.name !== 'paragraph') return false

    // Use content.cut() to preserve marks (bold, italic, etc.)
    const beforeContent = para.content.cut(0, splitOffset)
    const afterContent = para.content.cut(splitOffset)

    // Create new paragraphs preserving the original paragraph's attributes
    const beforePara = state.schema.nodes.paragraph.create(para.attrs, beforeContent)
    const afterPara = state.schema.nodes.paragraph.create(para.attrs, afterContent)

    // Replace the original paragraph with the "before" part
    tr.replaceWith(blockPos, blockPos + para.nodeSize, beforePara)

    // Now we need to find/create the next page and insert "after" content
    // Important: use tr.doc for all position lookups after modifications

    // Recalculate page positions on the modified document
    const newPagePositions: number[] = []
    tr.doc.descendants((node, pos) => {
      if (node.type.name === 'page') newPagePositions.push(pos)
    })

    let nextPagePos = newPagePositions[pageIndex + 1]

    // If next page doesn't exist, create it
    if (nextPagePos === undefined) {
      const emptyPara = state.schema.nodes.paragraph.create()
      const newPage = state.schema.nodes.page.create(null, emptyPara)

      // Insert at the end of the document
      const insertPos = tr.doc.content.size
      tr.insert(insertPos, newPage)

      // The new page starts at insertPos
      nextPagePos = insertPos
    }

    // Insert the "after" paragraph at the START of the next page
    // +1 to get inside the page node
    const insertPos = nextPagePos + 1
    tr.insert(insertPos, afterPara)

    // Set cursor to the start of the overflowed text on the new page
    // +1 for page node, +1 for paragraph node
    const $pos = tr.doc.resolve(insertPos + 1)
    tr.setSelection(TextSelection.near($pos))

    return true
  })
}
