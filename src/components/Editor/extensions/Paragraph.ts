import Paragraph from '@tiptap/extension-paragraph'
import { mergeAttributes } from '@tiptap/core'

export const SpanParagraph = Paragraph.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'pm-paragraph',
        'data-paragraph': '',
      }),
      0,
    ]
  },
})

