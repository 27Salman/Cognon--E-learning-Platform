import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { ROUTES } from '../../utils/constants';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">Cognon</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Student Dashboard</h2>
          <p className="text-gray-600 mb-6">Welcome! This dashboard will include your enrolled courses, progress tracking, and certificates.</p>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-primary-800 mb-4">Your Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-600">Name</p><p className="font-medium text-gray-800">{user?.name}</p></div>
              <div><p className="text-sm text-gray-600">Email</p><p className="font-medium text-gray-800">{user?.email}</p></div>
              <div><p className="text-sm text-gray-600">Phone</p><p className="font-medium text-gray-800">{user?.phone}</p></div>
              <div><p className="text-sm text-gray-600">Role</p><p className="font-medium text-gray-800 capitalize">{user?.role}</p></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
