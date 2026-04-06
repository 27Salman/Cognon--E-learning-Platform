import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLES, ROUTES } from '../utils/constants';

const getDashboard = (role) => {
    switch (role) {
        case ROLES.ADMIN:   return ROUTES.ADMIN_DASHBOARD;
        case ROLES.TUTOR:   return ROUTES.TUTOR_DASHBOARD;
        case ROLES.STUDENT: return ROUTES.STUDENT_DASHBOARD;
        default:            return ROUTES.HOME;
    }
};

export default function NotFound() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                {/* Animated 404 */}
                <div className="relative mb-8">
                    <p className="text-9xl font-black text-purple-600 opacity-10 select-none">404</p>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
                <p className="text-gray-500 mb-2">
                    The page <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-purple-700">{location.pathname}</span> doesn't exist.
                </p>
                <p className="text-gray-400 text-sm mb-8">
                    It may have been moved, deleted, or you may have mistyped the URL.
                </p>

                <div className="flex justify-center">
                    <button
                        onClick={() => navigate(getDashboard(user?.role), { replace: true })}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}
