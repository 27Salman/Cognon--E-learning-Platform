import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUnreadCount,
  fetchNotifications,
  toggleDropdown,
  closeDropdown,
} from "../../store/slices/notificationSlice";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const dispatch = useDispatch();
  const { unreadCount, dropdownOpen } = useSelector(
    (state) => state.notifications,
  );
  const bellRef = useRef(null);

  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        dispatch(closeDropdown());
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch]);

  const handleBellClick = () => {
    dispatch(toggleDropdown());
    if (!dropdownOpen) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && <NotificationDropdown />}
    </div>
  );
}
