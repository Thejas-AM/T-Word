import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {TextStyle} from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import { useDispatch } from 'react-redux';
import { setEditorContent, setHeadings } from '../store/editorSlice';
import { PageBreak } from '../components/Editor/extensions/PageBreak';

import Header from '../components/Layout/Header';
import Editor from '../components/Editor/Editor';
import Sidebar from '../components/Layout/Sidebar';
import Page from '../components/Editor/extensions/Page';
import { PageNumberDecoration } from '../components/Editor/extensions/PageNumberDecoration';
import { autoPaginate } from '../components/Editor/pagination';
import { SpanParagraph } from '../components/Editor/extensions/Paragraph';

const Home: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dispatch = useDispatch();

  const editor = useEditor({
    extensions: [
      StarterKit,
      SpanParagraph,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      PageBreak,
      Page
    ],
    onCreate({ editor }) {
      editor.registerPlugin(PageNumberDecoration)
    },
    content: `
      <div data-page>
        <h1>Welcome to T-Letter</h1>
        <p>This is a simple clone of MS Word. You can start typing here.</p>
        
      </div>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {

      let rafId: number | null = null;

      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        autoPaginate(editor)
      })
        
        // Dispatch content to Redux
        dispatch(setEditorContent(editor.getHTML()));
        
        // Extract headings for Sidebar
        const headings: { level: number; text: string; id: string; pos: number }[] = [];
        editor.state.doc.descendants((node, pos) => {
          // console.log(node)
          if (node.type.name === 'heading') {
            headings.push({
              level: node.attrs.level,
              text: node.textContent,
              id: pos.toString(), 
              pos: pos
            });
          }
        });
        dispatch(setHeadings(headings));
    },
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} editor={editor} />
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Editor editor={editor} />
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
