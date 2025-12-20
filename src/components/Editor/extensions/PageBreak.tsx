import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

// export const PageBreak = Node.create({
//   name: 'pageBreak',

//   group: 'block',

//   atom: true,

//   parseHTML() {
//     return [
//       {
//         tag: 'div[data-type="page-break"]',
//       },
//     ];
//   },

//   renderHTML({ HTMLAttributes }) {
//     return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break' })];
//   },

//   addNodeView() {
//     return ReactNodeViewRenderer(({ node }) => {
//         return (
//             <div className="page-break" data-type="page-break" contentEditable={false}>
//                 <span className="page-break-label">Page Break</span>
//             </div>
//         );
//     });
//   },
  
//   // addCommands() {
//   //   return {
//   //     setPageBreak:
//   //       () =>
//   //       ({ chain }) => {
//   //         return chain()
//   //           .insertContent({ type: this.name })
//   //           .run();
//   //       },
//   //   };
//   // },
// });


export const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-page-break]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-page-break': '',
        class: 'page-break',
      }),
    ]
  },
})