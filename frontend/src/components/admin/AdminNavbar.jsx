import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Logo from '../common/Logo';
import NotificationBell from '../common/NotificationBell';
import { ROUTES } from '../../utils/constants';

export default function AdminNavbar({ adminInfo }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const displayName = user?.name || adminInfo?.name || 'Admin';
  const profileImageSrc = adminInfo?.profileImageURL || adminInfo?.profileImage;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}>
          <Logo size={36} />
          <div>
            <h1 className="text-xl font-bold text-purple-600">Cognon</h1>
            <span className="text-sm text-gray-500 font-medium">Admin</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          
          <button
            onClick={() => navigate(ROUTES.ADMIN_PROFILE)}
            className="focus:outline-none"
          >
            {profileImageSrc ? (
              <img
                src={profileImageSrc}
                alt="Admin"
                className="w-9 h-9 rounded-full object-cover border-2 border-purple-400"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center border-2 border-purple-400">
                <span className="text-white font-bold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
