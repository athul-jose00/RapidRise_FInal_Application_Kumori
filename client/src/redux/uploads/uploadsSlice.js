import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const uploadsSlice = createSlice({
  name: "uploads",
  initialState,
  reducers: {
    addUpload: (state, action) => {
      // add to front
      state.items.unshift(action.payload);
    },
    updateUpload: (state, action) => {
      const { id, ...patch } = action.payload;
      state.items = state.items.map((u) =>
        u.id === id ? { ...u, ...patch } : u,
      );
    },
    removeUpload: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((u) => u.id !== id);
    },
    clearUploads: (state) => {
      state.items = [];
    },
  },
});

export const { addUpload, updateUpload, removeUpload, clearUploads } =
  uploadsSlice.actions;

export const selectUploads = (state) => state.uploads.items;

export default uploadsSlice.reducer;
