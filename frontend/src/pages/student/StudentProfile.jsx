import { useState, useRef, useEffect } from 'react';
import { Camera, Lock, Pencil } from 'lucide-react';
import StudentChangePasswordModal from '../../components/student/StudentChangePasswordModal';
import { studentAPI } from '../../api/studentAPI';
import toast from 'react-hot-toast';
import { validatePhone } from '../../utils/helpers';

const isValidImageSrc = (src) => src && (src.startsWith('http') || src.startsWith('data:'));

const getAvatarColors = (name) => {
    const palettes = [
        ['#7c3aed', '#a855f7'], // purple
        ['#2563eb', '#60a5fa'], // blue
        ['#059669', '#34d399'], // green
        ['#d97706', '#fbbf24'], // amber
        ['#dc2626', '#f87171'], // red
        ['#0891b2', '#22d3ee'], // cyan
        ['#7c3aed', '#ec4899'], // purple-pink
        ['#ea580c', '#fb923c'], // orange
    ];
    if (!name) return palettes[0];
    const index = name.charCodeAt(0) % palettes.length;
    return palettes[index];
};

export default function StudentProfile({ studentInfo, onUpdateProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const selectedFileRef = useRef(null);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const [formData, setFormData] = useState({
        name: studentInfo?.name || '',
        email: studentInfo?.email || '',
        phone: studentInfo?.phone || '',
        profileImage: studentInfo?.profileImage || null,
    });

    useEffect(() => {
        if (!isEditing) {
            setFormData({
                name: studentInfo?.name || '',
                email: studentInfo?.email || '',
                phone: studentInfo?.phone || '',
                profileImage: studentInfo?.profileImage || null,
            });
        }
    }, [studentInfo]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
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
            profileImage: studentInfo?.profileImage || null,
        });
        setIsEditing(false);
    };

    return (
        <div className="p-8 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
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

            <div className="bg-white rounded-lg shadow-sm p-8">

                {/* Avatar */}
                <div className="flex items-start gap-6 mb-8">
                    <div className="relative flex-shrink-0">
                        {isValidImageSrc(formData.profileImage) ? (
                            <img
                                src={formData.profileImage}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                            />
                        ) : (
                            (() => {
                                const [from, to] = getAvatarColors(formData.name);
                                const letter = formData.name?.charAt(0)?.toUpperCase() || 'S';
                                return (
                                    <div
                                        className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-md select-none"
                                        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                                    >
                                        <span className="text-white font-bold text-4xl drop-shadow-sm">
                                            {letter}
                                        </span>
                                    </div>
                                );
                            })()
                        )}
                        {isEditing && (
                            <label className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-1.5 cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                                <Camera className="w-4 h-4 text-white" />
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                    <div className="pt-2">
                        <h2 className="text-xl font-bold text-gray-900">{formData.name || 'Student'}</h2>
                        <p className="text-gray-500 text-sm">{formData.email}</p>
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-5">

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

            {showPasswordModal && (
                <StudentChangePasswordModal
                    studentInfo={{ ...studentInfo, email: formData.email }}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}
        </div>
    );
}
