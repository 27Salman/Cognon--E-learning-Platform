import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { studentAPI } from "../../api/studentAPI";
import { logoutUser } from "./authSlice";

export const fetchPublishedCourses = createAsyncThunk(
  "student/fetchPublishedCourses",
  async (params, { rejectWithValue }) => {
    try {
      const res = await studentAPI.fetchPublishedCourses(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch courses",
      );
    }
  },
);

export const fetchCourseDetails = createAsyncThunk(
  "student/fetchCourseDetails",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await studentAPI.fetchCourseDetails(courseId);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch course",
      );
    }
  },
);

export const enrollInCourse = createAsyncThunk(
  "student/enrollInCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await studentAPI.enrollInCourse(courseId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to enroll");
    }
  },
);

export const fetchEnrolledCourses = createAsyncThunk(
  "student/fetchEnrolledCourses",
  async (_, { rejectWithValue }) => {
    try {
      const res = await studentAPI.fetchEnrolledCourses();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch enrolled courses",
      );
    }
  },
);

export const fetchCourseProgress = createAsyncThunk(
  "student/fetchCourseProgress",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await studentAPI.fetchCourseProgress(courseId);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch progress",
      );
    }
  },
);

export const markLessonComplete = createAsyncThunk(
  "student/markLessonComplete",
  async ({ courseId, lessonId }, { rejectWithValue }) => {
    try {
      const res = await studentAPI.markLessonComplete(courseId, lessonId);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to mark lesson complete",
      );
    }
  },
);

const studentSlice = createSlice({
  name: "student",
  initialState: {
    catalog: [],
    enrolledCourses: [],
    currentCourse: null,
    progress: null,
    filters: { category: "", search: "" },
    loading: false,
    error: null,
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearStudentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublishedCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublishedCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.catalog = action.payload.courses || [];
      })
      .addCase(fetchPublishedCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCourseDetails.pending, (state) => {
        state.loading = true;
        state.courseError = null;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.loading = false;
        state.courseError = action.error?.message || "Course not found";
      })
      .addCase(enrollInCourse.fulfilled, (state) => {
        if (state.currentCourse) state.currentCourse.isEnrolled = true;
      })
      .addCase(fetchEnrolledCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEnrolledCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.enrolledCourses = action.payload.courses || [];
      })
      .addCase(fetchEnrolledCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCourseProgress.fulfilled, (state, action) => {
        state.progress = action.payload;
      })
      .addCase(markLessonComplete.fulfilled, (state, action) => {
        if (state.progress) {
          state.progress.completedLessons = Array.isArray(
            action.payload.completedLessons,
          )
            ? action.payload.completedLessons
            : [];
          state.progress.progress = action.payload.progress;
          const lesson = state.progress.lessons?.find(
            (l) => l._id === action.payload.lessonId,
          );
          if (lesson) lesson.isCompleted = true;
        }
      })
      // Clear all student data on logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.catalog = [];
        state.enrolledCourses = [];
        state.currentCourse = null;
        state.progress = null;
        state.filters = { category: "", search: "" };
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.catalog = [];
        state.enrolledCourses = [];
        state.currentCourse = null;
        state.progress = null;
        state.filters = { category: "", search: "" };
        state.error = null;
      });
  },
});

export const { setFilters, clearStudentError } = studentSlice.actions;
export default studentSlice.reducer;
