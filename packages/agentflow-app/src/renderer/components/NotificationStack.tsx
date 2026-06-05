import React from 'react';
import { useAppStore } from '../stores/appStore';

const NotificationStack: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-10 right-4 z-[100] space-y-2 max-w-xs">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`rounded-lg p-3 border shadow-lg animate-in slide-in-from-right ${
            notif.type === 'success' ? 'bg-af-success/10 border-af-success/30' :
            notif.type === 'error' ? 'bg-af-error/10 border-af-error/30' :
            notif.type === 'warning' ? 'bg-af-warning/10 border-af-warning/30' :
            'bg-af-accent/10 border-af-accent/30'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-xs font-medium ${
                notif.type === 'success' ? 'text-af-success' :
                notif.type === 'error' ? 'text-af-error' :
                notif.type === 'warning' ? 'text-af-warning' :
                'text-af-accent'
              }`}>
                {notif.title}
              </p>
              <p className="text-[10px] text-af-muted mt-0.5">{notif.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="text-af-muted hover:text-af-text text-xs"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationStack;
