import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { logoutUser } from "../user/userSlice";

export const fetchFiles = createAsyncThunk(
  "files/fetchFiles",
  async (_, thunkAPI) => {
    try {
      const res = await api.get(`/api/files`);
      return res.data.files || res.data;
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      if (status === 401 || status === 403) {
        thunkAPI.dispatch(logoutUser());
      }
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchTrashFiles = createAsyncThunk(
  "files/fetchTrashFiles",
  async (_, thunkAPI) => {
    try {
      const res = await api.get(`/api/files/trash`);
      return res.data.files || [];
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      if (status === 401 || status === 403) {
        thunkAPI.dispatch(logoutUser());
      }
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const uploadFile = createAsyncThunk(
  "files/uploadFile",
  async (file, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await api.post(`/api/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      thunkAPI.dispatch(fetchFiles());
      const uploadedFile =
        res.data.files && res.data.files[0] ? res.data.files[0] : res.data.file;
      return { file: uploadedFile, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteFile = createAsyncThunk(
  "files/deleteFile",
  async (id, thunkAPI) => {
    try {
      const res = await api.delete(`/api/files/${id}`);
      return { id, message: res.data?.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const permanentlyDeleteFile = createAsyncThunk(
  "files/permanentlyDeleteFile",
  async (id, thunkAPI) => {
    try {
      const res = await api.delete(`/api/files/${id}/permanent`);
      return { id, message: res.data?.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const emptyTrash = createAsyncThunk(
  "files/emptyTrash",
  async (_, thunkAPI) => {
    try {
      const res = await api.delete(`/api/files/trash/empty`);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const bulkDeleteFiles = createAsyncThunk(
  "files/bulkDeleteFiles",
  async (ids, thunkAPI) => {
    try {
      const res = await api.post(`/api/files/bulk-delete`, { ids });
      return { ids, message: res.data?.message, deletedIds: res.data?.deletedIds || ids };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const bulkPermanentlyDeleteFiles = createAsyncThunk(
  "files/bulkPermanentlyDeleteFiles",
  async (ids, thunkAPI) => {
    try {
      const res = await api.post(`/api/files/bulk-permanent`, { ids });
      return { ids, message: res.data?.message, deletedIds: res.data?.deletedIds || ids };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const bulkRestoreFiles = createAsyncThunk(
  "files/bulkRestoreFiles",
  async (ids, thunkAPI) => {
    try {
      const res = await api.post(`/api/files/bulk-restore`, { ids });
      return { ids, message: res.data?.message, restoredIds: res.data?.restoredIds || ids };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const generateBulkShareLink = createAsyncThunk(
  "files/generateBulkShareLink",
  async ({ fileIds, recipientEmail, expirationHours, message }, thunkAPI) => {
    try {
      const body = {
        fileIds,
        recipientEmail,
        expirationHours,
        message: message || "Shared via Kumori",
      };
      const res = await api.post(`/api/shares/bulk`, body);
      thunkAPI.dispatch(fetchFiles());
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const restoreFile = createAsyncThunk(
  "files/restoreFile",
  async (id, thunkAPI) => {
    try {
      const res = await api.post(`/api/files/${id}/restore`);
      return { id, message: res.data?.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const generateShareLink = createAsyncThunk(
  "files/generateShareLink",
  async (
    { id, expiresInMinutes, recipientEmail, expirationHours, message },
    thunkAPI,
  ) => {
    try {
      const body = {
        fileId: id,
        recipientEmail,
        expirationHours:
          expirationHours ||
          Math.max(1, Math.round((expiresInMinutes || 60) / 60)),
        message: message || "Shared via Kumori",
      };
      const res = await api.post(`/api/shares`, body);
      thunkAPI.dispatch(fetchFiles());
      return { id, ...res.data };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const initialState = {
  items: [],
  trashItems: [],
  loading: false,
  error: null,
  lastShare: null,
};

const fileSlice = createSlice({
  name: "files",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.file) state.items.unshift(action.payload.file);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(deleteFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((f) => f.id !== action.payload.id);
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(permanentlyDeleteFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(permanentlyDeleteFile.fulfilled, (state, action) => {
        state.loading = false;
        // remove from both lists if present
        state.items = state.items.filter((f) => f.id !== action.payload.id);
        state.trashItems = state.trashItems.filter(
          (f) => f.id !== action.payload.id,
        );
      })
      .addCase(permanentlyDeleteFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(emptyTrash.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(emptyTrash.fulfilled, (state) => {
        state.loading = false;
        state.trashItems = [];
      })
      .addCase(emptyTrash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(bulkDeleteFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteFiles.fulfilled, (state, action) => {
        state.loading = false;
        const deletedIds = action.payload.deletedIds || [];
        state.items = state.items.filter((f) => !deletedIds.includes(f.id));
      })
      .addCase(bulkDeleteFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(bulkPermanentlyDeleteFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkPermanentlyDeleteFiles.fulfilled, (state, action) => {
        state.loading = false;
        const deletedIds = action.payload.deletedIds || [];
        state.items = state.items.filter((f) => !deletedIds.includes(f.id));
        state.trashItems = state.trashItems.filter((f) => !deletedIds.includes(f.id));
      })
      .addCase(bulkPermanentlyDeleteFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(bulkRestoreFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkRestoreFiles.fulfilled, (state, action) => {
        state.loading = false;
        const restoredIds = action.payload.restoredIds || [];
        state.trashItems = state.trashItems.filter((f) => !restoredIds.includes(f.id));
      })
      .addCase(bulkRestoreFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(generateBulkShareLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateBulkShareLink.fulfilled, (state, action) => {
        state.loading = false;
        state.lastShare = action.payload || null;
      })
      .addCase(generateBulkShareLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(fetchTrashFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrashFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.trashItems = action.payload || [];
      })
      .addCase(fetchTrashFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(restoreFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreFile.fulfilled, (state, action) => {
        state.loading = false;
        state.trashItems = state.trashItems.filter(
          (f) => f.id !== action.payload.id,
        );
      })
      .addCase(restoreFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(generateShareLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateShareLink.fulfilled, (state, action) => {
        state.loading = false;
        state.lastShare = action.payload || null;
      })
      .addCase(generateShareLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const selectFiles = (state) => state.files.items;
export const selectTrashFiles = (state) => state.files.trashItems;

export default fileSlice.reducer;
