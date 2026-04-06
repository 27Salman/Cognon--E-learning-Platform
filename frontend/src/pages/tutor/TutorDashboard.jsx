import { useOutletContext } from 'react-router-dom';
import { BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function TutorDashboard() {
    const { tutorInfo } = useOutletContext();

    const isApproved = tutorInfo?.tutorProfile?.isApproved;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
            <p className="text-sm text-gray-500 mb-6">Welcome back, {tutorInfo?.name || 'Tutor'}</p>

            {/* Pending approval banner */}
            {!isApproved && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">Account pending approval</p>
                        <p className="text-sm text-amber-600 mt-0.5">Your tutor account is awaiting admin approval. You'll be able to create courses once approved.</p>
                    </div>
                </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500">My Courses</p>
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">0</p>
                    <p className="text-xs text-gray-400 mt-1">Published courses</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500">Students</p>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">0</p>
                    <p className="text-xs text-gray-400 mt-1">Total enrolled</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500">Revenue</p>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">₹0</p>
                    <p className="text-xs text-gray-400 mt-1">Total earnings</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500">Rating</p>
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-yellow-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">—</p>
                    <p className="text-xs text-gray-400 mt-1">Average rating</p>
                </div>
            </div>

            {/* Coming soon placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Course management coming soon</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                    You'll be able to create, manage, and track your courses here. Check back soon.
                </p>
            </div>
        </div>
    );
}
