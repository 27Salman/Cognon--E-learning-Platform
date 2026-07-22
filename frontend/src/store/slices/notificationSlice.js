import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationAPI } from "../../api/notificationAPI";

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationAPI.getUnreadCount();
      return res.data?.count ?? res.count ?? 0;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params, { rejectWithValue }) => {
    try {
      const res = await notificationAPI.getNotifications(params);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id, { rejectWithValue }) => {
    try {
      const res = await notificationAPI.markAsRead(id);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationAPI.markAllAsRead();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteOne",
  async (id, { rejectWithValue }) => {
    try {
      await notificationAPI.deleteOne(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);
const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    pagination: null,
    loading: false,
    dropdownOpen: false,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload.notification);
      state.unreadCount = action.payload.unreadCount;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    toggleDropdown: (state) => {
      state.dropdownOpen = !state.dropdownOpen;
    },
    closeDropdown: (state) => {
      state.dropdownOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const idx = state.notifications.findIndex(
          (n) => n._id === action.payload._id,
        );
        if (idx !== -1) state.notifications[idx].isRead = true;
        if (state.unreadCount > 0) state.unreadCount -= 1;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(
          (n) => n._id !== action.payload,
        );
      });
  },
});

export const {
  addNotification,
  setUnreadCount,
  toggleDropdown,
  closeDropdown,
} = notificationSlice.actions;
export default notificationSlice.reducer;
