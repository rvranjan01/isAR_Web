import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      navigate(link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2D5BFF] text-[10px] font-bold text-white shadow-glow">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 rounded-2xl border border-[var(--contrast)] bg-[var(--surface)] p-4 shadow-glow-lg text-[var(--ink)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--contrast)]">
            <h4 className="font-semibold text-sm font-heading">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-[#2D5BFF] hover:underline font-medium cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto space-y-2 divide-y divide-[var(--contrast)]">
            {notifications.length === 0 ? (
              <p className="text-center py-6 text-xs text-[var(--ink-soft)]">No notifications available</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.link)}
                  className={`pt-2.5 first:pt-0 pb-1 cursor-pointer transition-colors hover:bg-[var(--surface-soft)] p-2 rounded-xl ${
                    !n.read ? 'bg-[#2D5BFF]/5 font-medium' : 'opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h5 className="text-xs font-semibold text-[var(--ink)]">{n.title}</h5>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[#2D5BFF]" />}
                  </div>
                  <p className="text-xs text-[var(--ink-soft)] mt-1">{n.message}</p>
                  {n.link && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#2D5BFF] mt-1 font-medium">
                      View details <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
