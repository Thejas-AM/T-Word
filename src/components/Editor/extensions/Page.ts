import { Node } from '@tiptap/core'
import { TextSelection } from 'prosemirror-state'
import './pageNode.css'

const HEADER_FOOTER_SPACE = 80

const Page = Node.create({
  name: 'page',
  group: 'block',
  content: 'block+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-page]' }]
  },

  renderHTML() {
    return [
      'div',
      {
        'data-page': '',
        class: 'a4-page',
      },
      0,
    ]
  },
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const state = editor.state
        const sel = state.selection
        if (!sel.empty) return false

        const pagePositions: number[] = []
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'page') pagePositions.push(pos)
        })

        let currentIndex = -1
        let currentPos = -1
        let currentNode: any = null

        for (let i = 0; i < pagePositions.length; i++) {
          const pos = pagePositions[i]
          const node = state.doc.nodeAt(pos)
          if (!node) continue
          let firstOffset: number | null = null
          let firstChild: any = null
          node.forEach((child: any, offset: number) => {
            if (firstOffset === null) {
              firstOffset = offset
              firstChild = child
            }
          })
          if (firstOffset === null) continue
          const firstBlockPos = pos + 1 + firstOffset
          const firstStart = firstChild && firstChild.isTextblock ? firstBlockPos + 1 : firstBlockPos
          if (sel.from <= firstStart) {
            currentIndex = i
            currentPos = pos
            currentNode = node
            break
          }
        }

        if (currentIndex <= 0) return false

        const prevPos = pagePositions[currentIndex - 1]
        const prevNode = state.doc.nodeAt(prevPos)
        if (!prevNode || !currentNode) return false

        let firstOffset: number | null = null
        currentNode.forEach((_child: any, offset: number) => {
          if (firstOffset === null) firstOffset = offset
        })
        if (firstOffset === null) return false
        const childPos = currentPos + 1 + firstOffset

        const domPages = document.querySelectorAll('.a4-page') as NodeListOf<HTMLElement>
        const prevPageEl = domPages[currentIndex - 1]
        const currPageEl = domPages[currentIndex]
        if (!prevPageEl || !currPageEl) return false

        const prevTop = prevPageEl.getBoundingClientRect().top
        const maxHeight = prevPageEl.clientHeight - HEADER_FOOTER_SPACE
        const prevBlocks = Array.from(prevPageEl.children).filter(
          el =>
            !el.classList.contains('page-header') &&
            !el.classList.contains('page-footer') &&
            !el.hasAttribute('data-page')
        ) as HTMLElement[]
        const lastPrevBlock = prevBlocks[prevBlocks.length - 1]
        const usedPrev = lastPrevBlock ? (lastPrevBlock.getBoundingClientRect().bottom - prevTop) : 0
        const availablePrev = maxHeight - usedPrev

        const currBlocks = Array.from(currPageEl.children).filter(
          el =>
            !el.classList.contains('page-header') &&
            !el.classList.contains('page-footer') &&
            !el.hasAttribute('data-page')
        ) as HTMLElement[]
        const firstCurrBlock = currBlocks[0]
        const candidateHeight = firstCurrBlock ? firstCurrBlock.getBoundingClientRect().height : 0

        if (candidateHeight > availablePrev) {
          return false
        }

        return editor.commands.command(({ tr, state }) => {
          const moving = state.doc.nodeAt(childPos)
          if (!moving) return false

          tr.delete(childPos, childPos + moving.nodeSize)

          let insertPos = prevPos + prevNode.nodeSize - 1
          if (childPos < insertPos) insertPos -= moving.nodeSize
          tr.insert(insertPos, moving)

          const $sel = tr.doc.resolve(insertPos + (moving.isTextblock ? 1 : 0))
          tr.setSelection(TextSelection.near($sel))

          if (currentNode.childCount === 1 && pagePositions.length > 1) {
            tr.delete(currentPos, currentPos + currentNode.nodeSize)
          }

          return true
        })
      },
    }
  },
})

export default Page
