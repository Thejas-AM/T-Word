import React from 'react';
import { Editor  } from '@tiptap/react';
import { 
  FormatBold, 
  FormatItalic, 
  FormatUnderlined, 
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  Undo,
  Redo,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatColorText,
  FormatPaint,
  Title,
  Subject,
  InsertPageBreak,
  ContentCut,
  ContentCopy,
  ContentPaste
} from '@mui/icons-material';
import { 
  ToggleButton, 
  ToggleButtonGroup, 
  Divider, 
  Paper, 
  Stack, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box,
  Tooltip
} from '@mui/material';
import { BubbleMenu } from '@tiptap/react/menus'

interface ToolbarProps {
  editor: Editor | null;
}

const fonts = [
  'Arial', 'Verdana', 'Times New Roman', 'Georgia', 'Courier New', 
  'Calibri', 'Nunito', 'Roboto', 'Open Sans', 'Lato', 
  'Montserrat', 'Poppins', 'Source Sans Pro', 'Oswald', 'Raleway',
  'Merriweather', 'Playfair Display', 'Ubuntu', 'Droid Sans', 'Lora'
];

const fontSizes = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '60px', '72px'];

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const handleFontChange = (event: any) => {
    editor.chain().focus().setFontFamily(event.target.value).run();
  };

  const handleHeadingChange = (event: any) => {
    const level = event.target.value;
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  return (
    <>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1, 
          mb: 2, 
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
          <ToggleButtonGroup size="small">
            <Tooltip title="Cut (Ctrl+X)">
              <ToggleButton
                value="cut"
                onClick={() => {
                  const selection = editor.state.selection;
                  if (selection.empty) return;
                  const text = editor.state.doc.textBetween(selection.from, selection.to, '\n');
                  navigator.clipboard.writeText(text).then(() => {
                    editor.chain().focus().deleteSelection().run();
                  });
                }}
              >
                <ContentCut fontSize="small" />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Copy (Ctrl+C)">
              <ToggleButton
                value="copy"
                onClick={() => {
                  const selection = editor.state.selection;
                  if (selection.empty) return;
                  const text = editor.state.doc.textBetween(selection.from, selection.to, '\n');
                  navigator.clipboard.writeText(text);
                }}
              >
                <ContentCopy fontSize="small" />
              </ToggleButton>
            </Tooltip>
             <Tooltip title="Paste (Ctrl+V)">
              <ToggleButton
                value="paste"
                onClick={() => {
                  navigator.clipboard.readText().then(text => {
                    editor.chain().focus().insertContent(text).run();
                  }).catch(err => {
                    console.error('Failed to read clipboard contents: ', err);
                    alert('Browser blocked paste. Please use Ctrl+V.');
                  });
                }}
              >
                <ContentPaste fontSize="small" />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <ToggleButtonGroup size="small" exclusive>
            <Tooltip title="Undo (Ctrl+Z)">
              <ToggleButton
                value="undo"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                <Undo fontSize="small" />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <ToggleButton
                value="redo"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                <Redo fontSize="small" />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <FormControl size="small" sx={{ width: 120 }}>
            <Select
              value={editor.getAttributes('textStyle').fontFamily || 'Arial'}
              onChange={handleFontChange}
              displayEmpty
              inputProps={{ 'aria-label': 'Font Family' }}
              sx={{ height: 30, fontSize: '0.8rem' }}
            >
              {fonts.map((font) => (
                <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 100 }}>
             <Select
              value={editor.isActive('heading', { level: 1 }) ? 1 : 
                     editor.isActive('heading', { level: 2 }) ? 2 : 
                     editor.isActive('heading', { level: 3 }) ? 3 : 0}
              onChange={handleHeadingChange}
              displayEmpty
              sx={{ height: 30, fontSize: '0.8rem' }}
            >
              <MenuItem value={0}>Normal</MenuItem>
              <MenuItem value={1}>Title</MenuItem>
              <MenuItem value={2}>Heading 1</MenuItem>
              <MenuItem value={3}>Heading 2</MenuItem>
            </Select>
          </FormControl>

          <Divider orientation="vertical" flexItem />

          <ToggleButtonGroup size="small">
            <ToggleButton
              value="bold"
              selected={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <FormatBold fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="italic"
              selected={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <FormatItalic fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="underline"
              selected={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <FormatUnderlined fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="strike"
              selected={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <FormatStrikethrough fontSize="small" />
            </ToggleButton>
            
            <Tooltip title="Text Color">
                <ToggleButton
                value="color"
                selected={editor.isActive('textStyle', { color: '#000000' })}
                onClick={() => {
                    const color = prompt('Enter color hex (e.g., #ff0000):', '#000000');
                    if (color) editor.chain().focus().setColor(color).run();
                }}
                >
                <FormatColorText fontSize="small" />
                </ToggleButton>
            </Tooltip>

            <Tooltip title="Highlight Color">
                <ToggleButton
                value="highlight"
                selected={editor.isActive('highlight')}
                onClick={() => {
                     const color = prompt('Enter highlight color hex (e.g., #ffff00):', '#ffff00');
                     if(color) editor.chain().focus().toggleHighlight({ color }).run();
                }}
                >
                <FormatPaint fontSize="small" />
                </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <ToggleButtonGroup size="small" exclusive>
            <ToggleButton
              value="left"
              selected={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <FormatAlignLeft fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="center"
              selected={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <FormatAlignCenter fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="right"
              selected={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <FormatAlignRight fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="justify"
              selected={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            >
              <FormatAlignJustify fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <ToggleButtonGroup size="small">
            <ToggleButton
              value="bulletList"
              selected={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <FormatListBulleted fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="orderedList"
              selected={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <FormatListNumbered fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />
          
          <ToggleButtonGroup size="small">
             <Tooltip title="Insert Page Break">
                 <ToggleButton
                    value="pageBreak"
                    onClick={() => editor.chain().focus().insertContent({ type: 'pageBreak' }).run()}
                 >
                    <InsertPageBreak fontSize="small" />
                 </ToggleButton>
             </Tooltip>
          </ToggleButtonGroup>

        </Stack>
      </Paper>

      {editor && (
        <BubbleMenu editor={editor} >
          <Paper elevation={3} sx={{ display: 'flex', gap: 0.5, p: 0.5, borderRadius: 1 }}>
            <ToggleButton
              value="bold"
              size="small"
              selected={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <FormatBold fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="italic"
              size="small"
              selected={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <FormatItalic fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="underline"
              size="small"
              selected={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <FormatUnderlined fontSize="small" />
            </ToggleButton>
             <ToggleButton
                value="color"
                size="small"
                onClick={() => {
                    const color = prompt('Color:', '#000000');
                    if (color) editor.chain().focus().setColor(color).run();
                }}
                >
                <FormatColorText fontSize="small" />
            </ToggleButton>
          </Paper>
        </BubbleMenu>
      )}
    </>
  );
};

export default Toolbar;
