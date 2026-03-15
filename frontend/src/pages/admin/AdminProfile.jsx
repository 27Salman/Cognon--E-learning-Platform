import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Camera, Pencil, User, Mail, Phone } from 'lucide-react';

export default function AdminProfile({ adminInfo, onUpdateProfile }) {
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  // Use real logged-in admin data from Redux, fallback to adminInfo
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || adminInfo?.name || '',
    email: user?.email || adminInfo?.email || '',
    phone: user?.phone || adminInfo?.phone || '',
    profileImage: adminInfo?.profileImage || null,
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, profileImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || adminInfo?.name || '',
      email: user?.email || adminInfo?.email || '',
      phone: user?.phone || adminInfo?.phone || '',
      profileImage: adminInfo?.profileImage || null,
    });
    setIsEditing(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Page heading */}
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
      <p className="text-sm text-gray-500 mt-1 mb-8">Manage your admin profile</p>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-gray-800">Admin Profile</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-10">
          {/* Left — avatar */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="relative">
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-md">
                  <span className="text-4xl font-bold text-purple-600">
                    {formData.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
              )}
              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-md hover:bg-purple-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <p className="font-semibold text-gray-800 text-base">{formData.name}</p>
            <p className="text-xs text-gray-500">System Administrator</p>
          </div>

          {/* Right — fields */}
          <div className="flex-1 space-y-5">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>

            {/* Email — always read-only, shows real login email */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                value={user?.email || formData.email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={user?.phone || formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
