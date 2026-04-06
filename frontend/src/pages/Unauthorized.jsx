import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLES, ROUTES } from '../utils/constants';

const getDashboard = (role) => {
    switch (role) {
        case ROLES.ADMIN:   return ROUTES.ADMIN_DASHBOARD;
        case ROLES.TUTOR:   return ROUTES.TUTOR_DASHBOARD;
        case ROLES.STUDENT: return ROUTES.STUDENT_DASHBOARD;
        default:            return ROUTES.LOGIN;
    }
};

export default function Unauthorized() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="relative mb-8">
                    <p className="text-9xl font-black text-red-500 opacity-10 select-none">403</p>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
                <p className="text-gray-500 mb-8">
                    You don't have permission to view this page.
                </p>

                <button
                    onClick={() => navigate(getDashboard(user?.role), { replace: true })}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                    Go to My Dashboard
                </button>
            </div>
        </div>
    );
}
