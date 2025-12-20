import { Editor } from '@tiptap/react'
import { TextSelection } from 'prosemirror-state'

export function splitParagraphAcrossPages(
  editor: Editor,
  pageIndex: number,
  blockIndex: number,
  splitOffset: number
) {
  editor.commands.command(({ tr, state }) => {
    const pagePositions: number[] = []

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'page') pagePositions.push(pos)
    })

    const pagePos = pagePositions[pageIndex]
    let blockPos = pagePos + 1

    for (let i = 0; i < blockIndex; i++) {
      const n = state.doc.nodeAt(blockPos)
      if (!n) return false
      blockPos += n.nodeSize
    }

    const para = state.doc.nodeAt(blockPos)
    if (!para || para.type.name !== 'paragraph') return false

    const text = para.textContent

    const before = state.schema.text(text.slice(0, splitOffset))
    const after = state.schema.text(text.slice(splitOffset))

    const beforePara = state.schema.nodes.paragraph.create(null, before)
    const afterPara = state.schema.nodes.paragraph.create(null, after)

    tr.replaceWith(blockPos, blockPos + para.nodeSize, beforePara)

    // Create next page if missing
    if (!pagePositions[pageIndex + 1]) {
      const emptyPara = state.schema.nodes.paragraph.create()
      const pageNode = state.schema.nodes.page.create(null, emptyPara)
      tr.insert(state.doc.content.size, pageNode)
    }

    const insertPos = pagePositions[pageIndex + 1] + 1
    tr.insert(insertPos, afterPara)

    // ✅ Cursor goes to start of overflowed text
    const $pos = tr.doc.resolve(insertPos + 1)
    tr.setSelection(TextSelection.near($pos))

    return true
  })
}
