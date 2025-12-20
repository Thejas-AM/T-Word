import React from 'react';
import { Editor as TiptapEditor, EditorContent } from '@tiptap/react';
import { Box, Paper } from '@mui/material';
import Toolbar from './Toolbar';
import './EditorStyles.css';

interface EditorProps {
  editor: TiptapEditor | null;
}

const Editor: React.FC<EditorProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f0f2f5' }}>
      <Toolbar editor={editor} />
      
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          justifyContent: 'center', 
          p: 4,
          counterReset: 'page-counter'
        }}
      >
        <Paper 
          elevation={3}
          sx={{
            width: '210mm',
            minHeight: '297mm',
            padding: '25mm',
            backgroundColor: 'white',
            marginBottom: '2rem',
            cursor: 'text',
            position: 'relative',
          }}
          onClick={() => editor?.chain().focus().run()}
        >
           {/* Header Simulation */}
           <Box sx={{ position: 'absolute', top: '10mm', left: 0, right: 0, textAlign: 'center', color: '#999', fontSize: '0.8rem', pointerEvents: 'none' }}>
            Header - T-Letter Document
          </Box>

          <EditorContent editor={editor} />

           {/* Footer Simulation */}
           <Box sx={{ position: 'absolute', bottom: '10mm', left: 0, right: 0, textAlign: 'center', color: '#999', fontSize: '0.8rem', pointerEvents: 'none' }}>
             Footer - Page <span className="page-number">1</span>
          </Box>
        </Paper>
        
      </Box>
    </Box>
  );
};

export default Editor;
