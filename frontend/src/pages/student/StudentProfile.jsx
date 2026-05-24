import { useState, useRef, useEffect } from 'react';
import { Camera, Lock, Pencil, BookOpen, CheckCircle, User, Clock, Award } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import StudentChangePasswordModal from '../../components/student/StudentChangePasswordModal';
import { studentAPI } from '../../api/studentAPI';
import toast from 'react-hot-toast';
import { validatePhone, validateImageFile } from '../../utils/helpers';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000';

const getFullImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_BASE}${src}`;
};

const isValidImageSrc = (src) => src && (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/'));

const getAvatarColors = (name) => {
    const palettes = [
        ['#7c3aed', '#a855f7'],
        ['#2563eb', '#60a5fa'],
        ['#059669', '#34d399'],
        ['#d97706', '#fbbf24'],
        ['#dc2626', '#f87171'],
        ['#0891b2', '#22d3ee'],
        ['#7c3aed', '#ec4899'],
        ['#ea580c', '#fb923c'],
    ];
    if (!name) return palettes[0];
    const index = name.charCodeAt(0) % palettes.length;
    return palettes[index];
};

export default function StudentProfile() {
    const { studentInfo, onUpdateProfile } = useOutletContext();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const selectedFileRef = useRef(null);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [stats, setStats] = useState({ enrolled: 0, completed: 0, pending: 0, certificates: 0 });

    const [formData, setFormData] = useState({
        name: studentInfo?.name || '',
        email: studentInfo?.email || '',
        phone: studentInfo?.phone || '',
        profileImage: studentInfo?.profileImageURL || studentInfo?.profileImage || null,
    });

    useEffect(() => {
        if (!isEditing) {
            setFormData({
                name: studentInfo?.name || '',
                email: studentInfo?.email || '',
                phone: studentInfo?.phone || '',
                profileImage: studentInfo?.profileImageURL || studentInfo?.profileImage || null,
            });
        }
    }, [studentInfo]);

    useEffect(() => {
        if (!studentInfo || !studentInfo.name) {
            studentAPI.getProfile().then(res => {
                const data = res.data || res;
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    profileImage: data.profileImageURL || data.profileImage || null,
                });
            }).catch(() => {});
        }
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await studentAPI.getMyCourses();
                const courses = res.data || [];
                
                let enrolledCount = courses.length;
                let completedCount = 0;
                let pendingLessons = 0;

                courses.forEach(course => {
                    const enrollment = course.enrollment || {};
                    const totalLessons = course.totalLessons || 0;
                    const completedLessons = enrollment.completedLessons?.length || 0;
                    
                    if (completedLessons >= totalLessons && totalLessons > 0) {
                        completedCount++;
                    }
                    
                    pendingLessons += Math.max(0, totalLessons - completedLessons);
                });

                setStats({
                    enrolled: enrolledCount,
                    completed: completedCount,
                    pending: pendingLessons,
                    certificates: completedCount
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                setStats({ enrolled: 0, completed: 0, pending: 0, certificates: 0 });
            }
        };

        fetchStats();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const error = validateImageFile(file);
        if (error) {
            toast.error(error);
            e.target.value = '';
            return;
        }

        selectedFileRef.current = file;
        const reader = new FileReader();
        reader.onloadend = () => setFormData(prev => ({ ...prev, profileImage: reader.result }));
        reader.readAsDataURL(file);
    };

    const validate = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
        if (formData.phone && !validatePhone(formData.phone.trim())) {
            errors.phone = 'Invalid phone number (10 digits, starts with 6-9)';
        }
        return errors;
    };

    const handleSave = async () => {
        const errors = validate();
        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

        try {
            setLoading(true);
            const fd = new FormData();
            fd.append('name', formData.name.trim());
            fd.append('phone', formData.phone.trim());
            if (selectedFileRef.current) fd.append('profileImage', selectedFileRef.current);

            const result = await studentAPI.updateProfile(fd);
            const updatedUser = result.data;

            selectedFileRef.current = null;
            onUpdateProfile(updatedUser);

            setFormData({
                name: updatedUser.name || '',
                email: updatedUser.email || '',
                phone: updatedUser.phone || '',
                profileImage: updatedUser.profileImageURL || updatedUser.profileImage || null,
            });

            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        selectedFileRef.current = null;
        setFormErrors({});
        setFormData({
            name: studentInfo?.name || '',
            email: studentInfo?.email || '',
            phone: studentInfo?.phone || '',
            profileImage: studentInfo?.profileImageURL || studentInfo?.profileImage || null,
        });
        setIsEditing(false);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Enrolled</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.enrolled}</p>
                        </div>
                        <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Completed</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                        </div>
                        <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Pending</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                        </div>
                        <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-7 h-7 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Certificates</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.certificates}</p>
                        </div>
                        <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Award className="w-7 h-7 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-lg shadow-sm p-6">

                {/* Avatar */}
                <div className="mb-8">
                    <div className="flex justify-end mb-4">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit Profile
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="relative flex-shrink-0 mb-4">
                            {isValidImageSrc(formData.profileImage) ? (
                                <img
                                    src={getFullImageUrl(formData.profileImage)}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                                />
                            ) : (
                                (() => {
                                    const [from, to] = getAvatarColors(formData.name);
                                    const letter = formData.name?.charAt(0)?.toUpperCase() || 'S';
                                    return (
                                        <div
                                            className="w-32 h-32 rounded-full flex items-center justify-center border-4 border-white shadow-md select-none"
                                            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                                        >
                                            <span className="text-white font-bold text-5xl drop-shadow-sm">
                                                {letter}
                                            </span>
                                        </div>
                                    );
                                })()
                            )}
                            {isEditing && (
                                <label className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-1.5 cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                                    <Camera className="w-4 h-4 text-white" />
                                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">{formData.name || 'Student'}</h2>
                            <p className="text-gray-500 text-base">{formData.email}</p>
                        </div>
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your name"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-50 disabled:cursor-not-allowed ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your phone number"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-50 disabled:cursor-not-allowed ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
                    </div>

                    {/* Email — read only, no change option */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
                        />
                    </div>

                    {/* Change Password */}
                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            <Lock className="w-4 h-4" />
                            Change Password
                        </button>
                    </div>
                </div>

                {/* Save / Cancel */}
                {isEditing && (
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Right Column - Completed Certificates */}
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Completed Certificates
                    </h3>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No certificates earned yet</p>
                        <p className="text-gray-400 text-xs mt-1">Complete courses to earn certificates</p>
                    </div>
                </div>
            </div>
        </div>

        {showPasswordModal && (
            <StudentChangePasswordModal
                studentInfo={{ ...studentInfo, email: formData.email }}
                onClose={() => setShowPasswordModal(false)}
            />
        )}
    </div>
    );
}
