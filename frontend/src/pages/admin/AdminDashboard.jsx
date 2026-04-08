import React from 'react';
import { useSelector } from 'react-redux';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Manage users, courses, categories, and platform settings from this central admin panel.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Users</h3>
              <p className="text-3xl font-bold text-blue-600">Coming Soon</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Courses</h3>
              <p className="text-3xl font-bold text-green-600">Coming Soon</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Tutors Pending</h3>
              <p className="text-3xl font-bold text-purple-600">Coming Soon</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Admin Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-600">Name</p><p className="font-medium text-gray-800">{user?.name}</p></div>
              <div><p className="text-sm text-gray-600">Email</p><p className="font-medium text-gray-800">{user?.email}</p></div>
              <div><p className="text-sm text-gray-600">Role</p><p className="font-medium text-gray-800 capitalize">{user?.role}</p></div>
              <div><p className="text-sm text-gray-600">Status</p><p className="font-medium text-green-600">Active</p></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;




