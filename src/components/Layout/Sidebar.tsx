import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Search, Close } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Editor } from '@tiptap/react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, editor }) => {
  const [tabValue, setTabValue] = useState(0);
  const headings = useSelector((state: RootState) => state.editor.headings);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleHeadingClick = (pos: number) => {
    if (!editor) return;
    
    editor.chain().focus().setTextSelection(pos).run();
    
    // Scroll to the element
    try {
        const { node } = editor.view.domAtPos(pos);
        const element = node.nodeType === 3 ? node.parentElement : node as HTMLElement;
        if (element && element.scrollIntoView) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (e) {
        console.warn('Could not scroll to heading', e);
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        width: 300,
        height: '100%',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa',
        flexShrink: 0,
      }}
    >
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="bold">Navigation</Typography>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, mb: 1 }}>
         <TextField 
            fullWidth 
            size="small" 
            placeholder="Search document" 
            InputProps={{
              startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
         />
      </Box>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        variant="fullWidth" 
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Headings" />
        <Tab label="Pages" />
        <Tab label="Results" />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {tabValue === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Headings in your document:
            </Typography>
            <List dense>
              {headings.length > 0 ? (
                headings.map((heading, index) => (
                  // <ListItem key={index} button onClick={() => handleHeadingClick(Number(heading.id))}>
                  <ListItem key={index} onClick={() => handleHeadingClick(Number(heading.id))}>
                    <ListItemText 
                      primary={heading.text} 
                      sx={{ pl: (heading.level - 1) * 2 }}
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: heading.level === 1 ? 'bold' : 'normal' 
                      }}
                    />
                  </ListItem>
                ))
              ) : (
                <Typography variant="caption" color="text.secondary">No headings found.</Typography>
              )}
            </List>
          </Box>
        )}
        {tabValue === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
             <Box sx={{ width: 100, height: 140, border: '1px solid #ccc', bgcolor: 'white', boxShadow: 1 }} />
             <Typography variant="caption">Page 1</Typography>
          </Box>
        )}
        {tabValue === 2 && (
             <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                No results found.
             </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
