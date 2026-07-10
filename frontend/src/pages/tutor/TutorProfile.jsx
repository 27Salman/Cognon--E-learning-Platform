import { useState, useRef, useEffect } from 'react';
import { Camera, Lock, Pencil } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import ChangeEmailModal from '../../components/tutor/ChangeEmailModal';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import { ROUTES } from '../../utils/constants';
import { tutorAPI } from '../../api/tutorAPI';
import { validateImageFile } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function TutorProfile() {
    const { tutorInfo, onUpdateProfile } = useOutletContext();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false); 
    const selectedFileRef = useRef(null);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    
    const [formData, setFormData] = useState({
        name: tutorInfo?.name || '',
        email: tutorInfo?.email || '',
        phone: tutorInfo?.phone || '',
        subject: tutorInfo?.tutorProfile?.subject || tutorInfo?.subject || '',
        bio: tutorInfo?.tutorProfile?.bio || tutorInfo?.bio || '',
        profileImage: tutorInfo?.profileImageURL || tutorInfo?.profileImage || null
    });

    useEffect(() => {
        if (!isEditing) {
            setFormData({
                name: tutorInfo?.name || '',
                email: tutorInfo?.email || '',
                phone: tutorInfo?.phone || '',
                subject: tutorInfo?.tutorProfile?.subject || tutorInfo?.subject || '',
                bio: tutorInfo?.tutorProfile?.bio || tutorInfo?.bio || '',
                profileImage: tutorInfo?.profileImageURL || tutorInfo?.profileImage || null
            });
        }
    }, [tutorInfo]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'bio' && value.length > 500) {
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
        setFormData(prev => ({ ...prev, profileImage: URL.createObjectURL(file) }));
        e.target.value = '';
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('subject', formData.subject);
            formDataToSend.append('bio', formData.bio);

            if (selectedFileRef.current) {
                formDataToSend.append('profileImage', selectedFileRef.current);
            }

            const result = await tutorAPI.updateProfile(formDataToSend);
            const updatedUser = result.data;

            selectedFileRef.current = null;
            onUpdateProfile(updatedUser);

            setFormData({
                name: updatedUser.name || '',
                email: updatedUser.email || '',
                phone: updatedUser.phone || '',
                subject: updatedUser.tutorProfile?.subject || '',
                bio: updatedUser.tutorProfile?.bio || '',
                profileImage: updatedUser.profileImageURL || updatedUser.profileImage || null
            });

            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Update error full:', error);
            console.error('Response data:', error.response?.data);
            toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        selectedFileRef.current = null;
        setFormData({
            name: tutorInfo?.name || '',
            email: tutorInfo?.email || '',
            phone: tutorInfo?.phone || '',
            subject: tutorInfo?.tutorProfile?.subject || tutorInfo?.subject || '',
            bio: tutorInfo?.tutorProfile?.bio || tutorInfo?.bio || '',
            profileImage: tutorInfo?.profileImageURL || tutorInfo?.profileImage || null
        });
        setIsEditing(false);
    };
    return (
        <div className="p-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                
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

            {/* Profile Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                
                {/* Profile Picture Section */}
                <div className="flex items-start gap-8 mb-8">
                    <div className="relative">
                        {formData.profileImage ? (
                            <img
                                src={formData.profileImage}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-purple-600 flex items-center justify-center border-4 border-gray-200">
                                <span className="text-white font-bold text-4xl">
                                    {formData.name?.charAt(0)?.toUpperCase() || 'T'}
                                </span>
                            </div>
                        )}

                        {/* Camera Icon - only visible in edit mode */}
                        {isEditing && (
                            <label className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2 cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                                <Camera className="w-5 h-5 text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {formData.name || 'Tutor Name'}
                        </h2>
                        <p className="text-gray-600">{formData.email}</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            placeholder="Enter your name"
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                            />
                            <button
                                onClick={() => setShowEmailModal(true)}
                                className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-sky-50 transition-colors font-medium"
                            >
                                Change Email
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Email changes require verification for security
                        </p>
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your phone number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Subjects Teaching Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subjects Teaching
                        </label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="e.g., Mathematics, Physics, Chemistry"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Bio Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            maxLength={500}
                            rows={4}
                            placeholder="Tell students about yourself, your teaching experience, and expertise..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                        />
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">
                                Maximum 500 characters
                            </p>
                            <p className="text-xs text-gray-500">
                                {formData.bio?.length || 0}/500
                            </p>
                        </div>
                    </div>

                    {/* Change Password Button */}
                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            <Lock className="w-5 h-5" />
                            Change Password
                        </button>
                    </div>

                </div>

                {/* Action Buttons - Only show when editing */}
                {isEditing && (
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={`px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors ${loading ? 'opacity-70 cursor-wait' : ''}`}
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

            {/* Change Email Modal */}
            {showEmailModal && (
                <ChangeEmailModal
                    currentEmail={formData.email}
                    onClose={() => setShowEmailModal(false)}
                    onSuccess={(newEmail) => {
                        onUpdateProfile({ ...formData, email: newEmail });
                        setFormData(prev => ({ ...prev, email: newEmail }));
                        setShowEmailModal(false);
                    }}
                />
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <ChangePasswordModal
                    userInfo={{ ...tutorInfo, email: formData.email }}
                    onRequestOTP={() => tutorAPI.requestPasswordChange()}
                    onVerify={(pwd, otp) => tutorAPI.verifyPasswordChange(pwd, otp)}
                    onSuccessRedirect={ROUTES.LOGIN}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}
        </div>
    );
}
