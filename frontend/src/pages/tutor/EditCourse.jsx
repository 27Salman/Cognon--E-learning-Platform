import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Trash2 } from 'lucide-react';
import { courseAPI } from '../../api/courseAPI';
import { tutorAPI } from '../../api/tutorAPI';
import ConfirmModal from '../../components/common/ConfirmModal';
import ImageCropModal from '../../components/common/ImageCropModal';
import toast from 'react-hot-toast';
import { ROUTES, COURSE_STATUS } from '../../utils/constants';


export default function EditCourse() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({ title: '', category: '', price: '', offerPercentage: '', description: '', status: COURSE_STATUS.DRAFT });
    const [thumbnail, setThumbnail] = useState(null);
    const [preview, setPreview] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);

    const [lessonForm, setLessonForm] = useState({
        title: '', duration: '', videoUrl: '', description: '',
        chapterTitle: 'Chapter 1', chapterOrder: 1
    });
    const [lessonThumbnail, setLessonThumbnail] = useState(null);
    const [lessonThumbnailPreview, setLessonThumbnailPreview] = useState(null);
    const [lessonPdf, setLessonPdf] = useState(null);
    const [lessonVideo, setLessonVideo] = useState(null);
    const [addingLesson, setAddingLesson] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [confirmCourse, setConfirmCourse] = useState(false);
    const [confirmLesson, setConfirmLesson] = useState({ open: false, id: null, title: '' });
    const [deletingLesson, setDeletingLesson] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);         // course thumbnail crop
    const [lessonCropSrc, setLessonCropSrc] = useState(null); // lesson thumbnail crop
    const [uploadProgress, setUploadProgress] = useState(0);

    const resetLessonForm = () => {
        setLessonForm({ title: '', duration: '', videoUrl: '', description: '', chapterTitle: 'Chapter 1', chapterOrder: 1 });
        setLessonThumbnail(null);
        setLessonThumbnailPreview(null);
        setLessonPdf(null);
        setLessonVideo(null);
        setEditingLesson(null);
    };

    useEffect(() => {
        loadCourse();
        tutorAPI.getCategories()
            .then(res => setCategories(res.data.categories || []))
            .catch(() => setCategories([]));
    }, [id]);

    const loadCourse = async () => {
        setLoading(true);
        try {
            const res = await courseAPI.getCourseById(id);
            const course = res?.data || res;
            setForm({
                title: course.title || '',
                category: course.category || '',
                price: course.price || '',
                offerPercentage: course.offerPercentage || '',
                description: course.description || '',
                status: course.status || COURSE_STATUS.DRAFT
            });
            setPreview(course.thumbnailURL || null);
            setLessons(course.lessons || []);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to load course');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== undefined) formData.append(k, v); });
            if (thumbnail) formData.append('thumbnail', thumbnail);
            await courseAPI.updateCourse(id, formData);
            toast.success('Course updated!');
            navigate(ROUTES.TUTOR_COURSES);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update course');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await courseAPI.deleteCourse(id);
            toast.success('Course deleted');
            navigate(ROUTES.TUTOR_COURSES);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete');
        }
    };

    const handleAddLesson = async () => {
        if (!lessonForm.title) return toast.error('Lesson title required');
        if (!lessonForm.chapterTitle?.trim()) return toast.error('Chapter title required');
        setAddingLesson(true);
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append('title', lessonForm.title);
            if (lessonForm.description) formData.append('description', lessonForm.description);
            formData.append('duration', lessonForm.duration || 0);
            formData.append('chapterTitle', lessonForm.chapterTitle.trim());
            formData.append('chapterOrder', lessonForm.chapterOrder || 1);
            if (lessonThumbnail) formData.append('thumbnail', lessonThumbnail);
            if (lessonPdf) formData.append('pdfNotes', lessonPdf);
            if (lessonVideo) formData.append('video', lessonVideo);

            const config = {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            };

            if (editingLesson) {
                const res = await courseAPI.updateLesson(editingLesson._id, formData, config);
                const updated = res?.data || res;
                setLessons(prev => prev.map(l => l._id === editingLesson._id ? updated : l));
                toast.success('Lesson updated');
            } else {
                formData.append('order', lessons.length + 1);
                const res = await courseAPI.createLesson(id, formData, config);
                const newLesson = res?.data || res;
                setLessons(prev => [...prev, newLesson]);
                toast.success('Lesson added');
            }
            resetLessonForm();
        } catch (err) {
            const data = err?.response?.data;
            const errorMsg = data?.errors?.[0]?.message || data?.message || 'Failed to save lesson';
            toast.error(errorMsg);
        } finally {
            setAddingLesson(false);
            setUploadProgress(0);
        }
    };

    const handleEditLesson = (lesson) => {
        setEditingLesson(lesson);
        setLessonForm({
            title: lesson.title || '',
            duration: lesson.duration || '',
            videoUrl: lesson.videoUrl || '',
            description: lesson.description || '',
            chapterTitle: lesson.chapter?.title || 'Chapter 1',
            chapterOrder: lesson.chapter?.order || 1,
        });
        setLessonThumbnailPreview(lesson.thumbnailURL || null);
        setLessonPdf(null);
        setLessonVideo(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteLesson = async () => {
        setDeletingLesson(true);
        try {
            await courseAPI.deleteLesson(confirmLesson.id);
            setLessons(prev => prev.filter(l => l._id !== confirmLesson.id));
            toast.success('Lesson deleted');
            setConfirmLesson({ open: false, id: null, title: '' });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete lesson');
        } finally {
            setDeletingLesson(false);
        }
    };

    if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Edit Course</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/tutor/courses/${id}/quiz`)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                        Manage Quiz
                    </button>
                    <button
                        onClick={() => setConfirmCourse(true)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                        Delete Course
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Left */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                        <input name="title" value={form.title} onChange={handleChange}
                            className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Category</label>
                        <select name="category" value={form.category} onChange={handleChange}
                            className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                            <option value="">Select category</option>
                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
                        <input name="price" type="number" value={form.price} onChange={handleChange}
                            className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Offer Percentage (%)</label>
                        <input name="offerPercentage" type="number" min="0" max="100" value={form.offerPercentage} onChange={handleChange}
                            placeholder="0"
                            className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        {form.offerPercentage > 0 && form.price > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                                Discounted price: ₹{Math.round(form.price * (1 - form.offerPercentage / 100))}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" value={form.status} onChange={handleChange}
                            className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                            <option value={COURSE_STATUS.DRAFT}>Draft</option>
                            <option value={COURSE_STATUS.PUBLISHED}>Published</option>
                        </select>
                    </div>
                </div>

                {/* Right */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                        <label className="block w-full h-36 border-2 border-dashed border-purple-300 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors">
                            {preview ? (
                                <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-purple-400">
                                    <Upload className="w-6 h-6 mb-1" />
                                    <p className="text-sm">Upload cover image</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                            className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                    </div>
                </div>
            </div>

            {/* Add/Edit Lesson form */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-700">
                        {editingLesson ? `Editing: ${editingLesson.title}` : 'Add New Lesson'}
                    </h2>
                    {editingLesson && (
                        <button onClick={resetLessonForm} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                            Cancel
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Chapter fields */}
                    <input placeholder="Chapter Title (e.g. Introduction)" value={lessonForm.chapterTitle}
                        onChange={e => setLessonForm(p => ({ ...p, chapterTitle: e.target.value }))}
                        className="border border-purple-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    <input placeholder="Chapter Order (e.g. 1)" type="number" min="1" value={lessonForm.chapterOrder}
                        onChange={e => setLessonForm(p => ({ ...p, chapterOrder: e.target.value }))}
                        className="border border-purple-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />

                    <input placeholder="Lesson Title" value={lessonForm.title}
                        onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))}
                        className="border border-purple-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    <input placeholder="Duration (minutes)" type="number" value={lessonForm.duration}
                        onChange={e => setLessonForm(p => ({ ...p, duration: e.target.value }))}
                        className="border border-purple-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />

                    <div className="col-span-2">
                        <label className="flex items-center justify-between cursor-pointer bg-white border border-purple-200 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors w-full text-sm text-gray-500">
                            <span className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-purple-600" />
                                {lessonVideo ? lessonVideo.name : (lessonForm.videoUrl ? 'Replace existing video (MP4, MOV)' : 'Upload Video (MP4, MOV)')}
                            </span>
                            <input type="file" accept="video/*" className="hidden" onChange={e => {
                                const file = e.target.files[0];
                                if (file) setLessonVideo(file);
                            }} />
                        </label>
                    </div>
                    <textarea
                        placeholder="Lesson description (optional)"
                        value={lessonForm.description}
                        onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))}
                        rows={2}
                        className="border border-purple-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none col-span-2"
                    />
                </div>

                {/* Thumbnail + PDF uploads */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Lesson Thumbnail</p>
                        <label className="block w-full h-24 border-2 border-dashed border-purple-300 bg-white rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                            {lessonThumbnailPreview ? (
                                <img src={lessonThumbnailPreview} alt="thumb" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-purple-400">
                                    <Upload className="w-5 h-5 mb-1" />
                                    <p className="text-xs">Upload Thumbnail</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                    setLessonCropSrc(URL.createObjectURL(file));
                                    e.target.value = '';
                                }
                            }} />
                        </label>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Upload PDF Notes</p>
                        <label className="block w-full h-24 border-2 border-dashed border-purple-300 bg-white rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                            <div className="flex flex-col items-center justify-center h-full text-purple-400">
                                <Upload className="w-5 h-5 mb-1" />
                                <p className="text-xs">{lessonPdf ? lessonPdf.name : 'Upload PDF'}</p>
                            </div>
                            <input type="file" accept=".pdf" className="hidden" onChange={e => {
                                const file = e.target.files[0];
                                if (file) setLessonPdf(file);
                            }} />
                        </label>
                    </div>
                </div>

                <button onClick={handleAddLesson} disabled={addingLesson}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                    {addingLesson ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            {uploadProgress > 0 ? `Uploading (${uploadProgress}%)` : 'Saving...'}
                        </>
                    ) : (
                        editingLesson ? 'Update Lesson' : 'Add Lesson'
                    )}
                </button>
            </div>

            {/* Lessons grouped by chapter */}
            {lessons.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">
                        Lessons ({lessons.length})
                    </h2>
                    {(() => {
                        const chapMap = {};
                        lessons.forEach(l => {
                            const key = l.chapter?.order ?? 1;
                            if (!chapMap[key]) chapMap[key] = { order: key, title: l.chapter?.title ?? 'Chapter 1', lessons: [] };
                            chapMap[key].lessons.push(l);
                        });
                        const chapters = Object.values(chapMap)
                            .sort((a, b) => a.order - b.order)
                            .map(ch => ({ ...ch, lessons: ch.lessons.sort((a, b) => a.order - b.order) }));

                        return chapters.map(chapter => (
                            <div key={chapter.order} className="mb-4">
                                {/* Chapter header */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-px flex-1 bg-purple-200" />
                                    <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                                        Chapter {chapter.order}: {chapter.title}
                                    </span>
                                    <div className="h-px flex-1 bg-purple-200" />
                                </div>
                                <div className="space-y-2">
                                    {chapter.lessons.map((lesson, i) => (
                                        <div key={lesson._id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-purple-100 flex-shrink-0">
                                                {lesson.thumbnailURL ? (
                                                    <img src={lesson.thumbnailURL} alt={lesson.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-purple-600 text-xs font-bold">
                                                        #{i + 1}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 text-sm truncate">{lesson.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {lesson.duration > 0 ? `${lesson.duration} min` : 'No duration'}
                                                    {lesson.videoUrl ? ' · Video' : ''}
                                                    {lesson.pdfNotesURL ? ' · PDF' : ''}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => handleEditLesson(lesson)}
                                                    className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors">
                                                    Edit
                                                </button>
                                                <button onClick={() => setConfirmLesson({ open: true, id: lesson._id, title: lesson.title })}
                                                    className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors">
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                    className="bg-purple-600 text-white px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-60">
                    {saving ? 'Saving...' : 'Submit'}
                </button>
            </div>

            <ConfirmModal
                isOpen={confirmCourse}
                title="Delete Course"
                message="Are you sure you want to delete this course? All lessons will also be deleted. This cannot be undone."
                confirmText="Yes, Delete"
                onConfirm={handleDelete}
                onClose={() => setConfirmCourse(false)}
            />

            <ConfirmModal
                isOpen={confirmLesson.open}
                title="Delete Lesson"
                message={`Are you sure you want to delete "${confirmLesson.title}"?`}
                confirmText="Yes, Delete"
                loading={deletingLesson}
                onConfirm={handleDeleteLesson}
                onClose={() => setConfirmLesson({ open: false, id: null, title: '' })}
            />

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspectRatio={16 / 9}
                    onCrop={(file, url) => { setThumbnail(file); setPreview(url); setCropSrc(null); }}
                    onClose={() => setCropSrc(null)}
                />
            )}

            {lessonCropSrc && (
                <ImageCropModal
                    imageSrc={lessonCropSrc}
                    aspectRatio={16 / 9}
                    onCrop={(file, url) => { setLessonThumbnail(file); setLessonThumbnailPreview(url); setLessonCropSrc(null); }}
                    onClose={() => setLessonCropSrc(null)}
                />
            )}
        </div>
    );
}
