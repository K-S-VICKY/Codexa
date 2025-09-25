import { useEffect, useRef } from 'react';
import { Task } from '../types/task';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export const useNotifications = (tasks: Task[]) => {
  const lastNotificationTime = useRef<{ [key: string]: number }>({});
  const checkInterval = useRef<NodeJS.Timeout>();

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const showNotification = ({ title, body, icon, tag }: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag,
        requireInteraction: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  };

  const checkForDeadlineNotifications = () => {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    tasks.forEach(task => {
      if (!task.deadline || task.status === 'completed') return;

      const deadline = new Date(task.deadline);
      const taskKey = `task-${task.id}`;
      const lastNotified = lastNotificationTime.current[taskKey] || 0;
      const timeSinceLastNotification = now.getTime() - lastNotified;

      // Don't notify more than once per hour for the same task
      if (timeSinceLastNotification < 60 * 60 * 1000) return;

      let shouldNotify = false;
      let notificationMessage = '';

      if (deadline <= now) {
        // Task is overdue
        shouldNotify = true;
        notificationMessage = `"${task.title}" is overdue!`;
      } else if (deadline <= oneHourFromNow) {
        // Task is due within an hour
        shouldNotify = true;
        notificationMessage = `"${task.title}" is due within an hour!`;
      } else if (deadline <= oneDayFromNow) {
        // Task is due within 24 hours
        shouldNotify = true;
        notificationMessage = `"${task.title}" is due tomorrow!`;
      }

      if (shouldNotify) {
        showNotification({
          title: 'Task Deadline Alert',
          body: notificationMessage,
          tag: `deadline-${task.id}`
        });

        lastNotificationTime.current[taskKey] = now.getTime();
      }
    });
  };

  const checkForCompletedTasks = () => {
    const recentlyCompleted = tasks.filter(task => {
      const completedTime = new Date(task.updatedAt);
      const now = new Date();
      const timeDiff = now.getTime() - completedTime.getTime();
      
      // Check if task was completed in the last 30 seconds
      return task.status === 'completed' && timeDiff < 30 * 1000;
    });

    recentlyCompleted.forEach(task => {
      const taskKey = `completed-${task.id}`;
      const lastNotified = lastNotificationTime.current[taskKey] || 0;
      const timeSinceLastNotification = now.getTime() - lastNotified;

      if (timeSinceLastNotification < 30 * 1000) return;

      showNotification({
        title: 'Task Completed! 🎉',
        body: `Great job completing "${task.title}"!`,
        tag: `completed-${task.id}`
      });

      lastNotificationTime.current[taskKey] = now.getTime();
    });
  };

  useEffect(() => {
    requestNotificationPermission();

    // Check for notifications every minute
    checkInterval.current = setInterval(() => {
      checkForDeadlineNotifications();
      checkForCompletedTasks();
    }, 60000);

    // Initial check
    checkForDeadlineNotifications();

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [tasks]);

  return {
    showNotification,
    requestNotificationPermission
  };
};
