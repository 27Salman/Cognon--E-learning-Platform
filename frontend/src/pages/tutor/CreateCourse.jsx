import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Upload } from 'lucide-react';
import { createCourse } from '../../store/slices/courseSlice';
import ImageCropModal from '../../components/common/ImageCropModal';
import toast from 'react-hot-toast';

const CATEGORIES = ['Web Development', 'Data Science', 'Graphic Design', 'Business', 'Marketing', 'IT & Software', 'Languages', 'Programming'];

export default function CreateCourse() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [form, setForm] = useState({ title: '', category: '', price: '', offerPercentage: '', description: '' });
    const [thumbnail, setThumbnail] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const handleCropDone = (croppedFile, croppedPreview) => {
        setThumbnail(croppedFile);
        setPreview(croppedPreview);
        setCropSrc(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.category) return toast.error('Title and category are required');

        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
        if (thumbnail) formData.append('thumbnail', thumbnail);

        setLoading(true);
        try {
            const result = await dispatch(createCourse(formData)).unwrap();
            toast.success('Course created!');
            navigate(`/tutor/courses/${result._id || result.data?._id}/edit`);
        } catch (err) {
            toast.error(err || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Course</h1>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="Enter course title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Category</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="">Select category</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
                            <input
                                name="price"
                                type="number"
                                value={form.price}
                                onChange={handleChange}
                                className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="₹0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Percentage</label>
                            <input
                                name="offerPercentage"
                                type="number"
                                value={form.offerPercentage}
                                onChange={handleChange}
                                className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="0%"
                            />
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                        {/* Thumbnail upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                            <label className="block w-full h-36 border-2 border-dashed border-purple-300 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors">
                                {preview ? (
                                    <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-purple-400">
                                        <Upload className="w-6 h-6 mb-1" />
                                        <p className="text-sm font-medium">Upload cover image</p>
                                        <p className="text-xs">Drop your file here</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                            </label>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={5}
                                className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                                placeholder="Course description..."
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-purple-600 text-white px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Creating...' : 'Add Course Lessons'}
                    </button>
                </div>
            </form>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspectRatio={16 / 9}
                    onCrop={handleCropDone}
                    onClose={() => setCropSrc(null)}
                />
            )}
        </div>
    );
}
