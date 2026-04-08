import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { courseAPI } from '../../api/courseAPI';
import { logoutUser } from './authSlice';

export const fetchMyCourses = createAsyncThunk(
    'courses/fetchMyCourses',
    async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
        try {
            const res = await courseAPI.getMyCourses(page, limit);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
        }
    }
);

export const fetchDashboard = createAsyncThunk(
    'courses/fetchDashboard',
    async (_, { rejectWithValue }) => {
        try {
            const { tutorAPI } = await import('../../api/tutorAPI');
            const res = await tutorAPI.getDashboard();
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch dashboard');
        }
    }
);

export const createCourse = createAsyncThunk(
    'courses/create',
    async (formData, { rejectWithValue }) => {
        try {
            const res = await courseAPI.createCourse(formData);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to create course');
        }
    }
);

export const deleteCourse = createAsyncThunk(
    'courses/delete',
    async (id, { rejectWithValue }) => {
        try {
            await courseAPI.deleteCourse(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to delete course');
        }
    }
);

const courseSlice = createSlice({
    name: 'courses',
    initialState: {
        list: [],
        pagination: { currentPage: 1, totalPages: 1, totalCourses: 0, hasNext: false, hasPrev: false },
        dashboard: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearCourseError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyCourses.pending, (state) => { state.loading = true; })
            .addCase(fetchMyCourses.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload?.data || action.payload;
                state.list = payload?.courses || [];
                state.pagination = payload?.pagination || state.pagination;
            })
            .addCase(fetchMyCourses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchDashboard.fulfilled, (state, action) => {
                state.dashboard = action.payload?.data || action.payload;
            })
            .addCase(createCourse.fulfilled, (state, action) => {
                const course = action.payload?.data || action.payload;
                if (course?._id) state.list.unshift(course);
            })
            .addCase(deleteCourse.fulfilled, (state, action) => {
                state.list = state.list.filter(c => c._id !== action.payload);
            })
            // Clear all course data on logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.list = [];
                state.pagination = { currentPage: 1, totalPages: 1, totalCourses: 0, hasNext: false, hasPrev: false };
                state.dashboard = null;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state) => {
                state.list = [];
                state.pagination = { currentPage: 1, totalPages: 1, totalCourses: 0, hasNext: false, hasPrev: false };
                state.dashboard = null;
                state.error = null;
            });
    }
});

export const { clearCourseError } = courseSlice.actions;
export default courseSlice.reducer;
