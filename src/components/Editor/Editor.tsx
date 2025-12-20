import React, { useEffect } from 'react'
import { EditorContent, Editor as TiptapEditor } from '@tiptap/react'
import { Box } from '@mui/material'
import Toolbar from './Toolbar';
import './styles.css'
import './EditorStyles.css';

interface Props {
  editor: TiptapEditor | null
}

const Editor: React.FC<Props> = ({ editor }) => {

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f0f2f5' }}>
      <Toolbar editor={editor} />
      <Box
        sx={{
          height: '100vh',
          overflowY: 'auto',
          bgcolor: '#f0f2f5',
          padding: 4,
        }}
        // onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  )
}

export default Editor
