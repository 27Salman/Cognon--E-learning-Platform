import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

/**
 * Redux Store Configuration
 * Add all slices here
 */
const store = configureStore({
  reducer: {
    auth: authReducer,
    // Future slices will be added here:
    // courses: courseReducer,
    // categories: categoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
