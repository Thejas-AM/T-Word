import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface EditorState {
  content: string; // HTML or JSON string
  headings: { level: number; text: string; id: string; pos: number }[];
  pageCount: number;
}

const initialState: EditorState = {
  content: '',
  headings: [],
  pageCount: 1,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setEditorContent: (state, action: PayloadAction<string>) => {
      state.content = action.payload;
    },
    setHeadings: (state, action: PayloadAction<{ level: number; text: string; id: string; pos: number }[]>) => {
      state.headings = action.payload;
    },
    setPageCount: (state, action: PayloadAction<number>) => {
      state.pageCount = action.payload;
    },
  },
});

export const { setEditorContent, setHeadings, setPageCount } = editorSlice.actions;
export default editorSlice.reducer;
