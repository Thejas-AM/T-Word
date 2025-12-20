import React from 'react';
import { AppBar, Toolbar as MuiToolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Description, Search, AccountCircle } from '@mui/icons-material';

const Header: React.FC = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#2b579a', zIndex: 1201 }}>
      <MuiToolbar variant="dense">
        <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
          <Description />
        </IconButton>
        
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" component="div" sx={{ mr: 2 }}>
              Document1 - T-Letter
            </Typography>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1, borderRadius: 1, fontSize: '0.75rem' }}>
              Saved
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['File', 'Home', 'Insert', 'Layout', 'References', 'Review', 'View', 'Help'].map((item) => (
              <Button 
                key={item} 
                color="inherit" 
                size="small" 
                sx={{ 
                  minWidth: 'auto', 
                  padding: '0 8px', 
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  fontWeight: item === 'Home' ? 'bold' : 'normal',
                  borderBottom: item === 'Home' ? '2px solid white' : 'none',
                  borderRadius: 0
                }}
              >
                {item}
              </Button>
            ))}
          </Box>
        </Box>

        <IconButton color="inherit">
          <Search />
        </IconButton>
        <IconButton color="inherit">
          <AccountCircle />
        </IconButton>
      </MuiToolbar>
    </AppBar>
  );
};

export default Header;
