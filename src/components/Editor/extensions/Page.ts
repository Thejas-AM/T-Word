import { Node } from '@tiptap/core'
// import './pageNode.css'

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
})

export default Page
