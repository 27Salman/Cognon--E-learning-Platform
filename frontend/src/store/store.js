import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import courseReducer from "./slices/courseSlice";
import studentReducer from "./slices/studentSlice";
import notificationReducer from "./slices/notificationSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    student: studentReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
