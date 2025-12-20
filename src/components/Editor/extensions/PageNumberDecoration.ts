import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const PageNumberDecoration = new Plugin({
  props: {
    decorations(state) {
      const decorations: Decoration[] = []
      const pagePositions: number[] = []

      // Collect all page positions
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'page') {
          pagePositions.push(pos)
        }
      })

      const totalPages = pagePositions.length

      pagePositions.forEach((pos, index) => {
        decorations.push(
          Decoration.widget(pos + 1, () => {
            const footer = document.createElement('div')
            footer.className = 'page-footer'
            footer.innerText = `Page ${index + 1} of ${totalPages}`
            return footer
          })
        )
      })

      return DecorationSet.create(state.doc, decorations)
    },
  },
})
