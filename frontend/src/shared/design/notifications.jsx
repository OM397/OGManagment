// 🎯 Drag & Drop Notification System
import React, { useState, useEffect } from 'react';
import { Badge } from '../design/components';

export const DragDropNotification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification && notification.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification || !notification.show) return null;

  const { type, title, message, asset } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      ${getBgColor()} border rounded-lg shadow-lg p-4
      transform transition-all duration-300 ease-out
      animate-slide-in-right
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
          {asset && (
            <div className="mt-2">
              <Badge variant="gray" size="sm">
                {asset.name}
              </Badge>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// 🎵 Simple Sound Effects for Drag & Drop (DISABLED)
export const useDragDropSounds = () => {
  const playSound = (type) => {
    // Sounds disabled per user request
    return;
  };

  return { playSound };
};

// 📳 Simple Haptic Feedback (for mobile devices)
export const useHapticFeedback = () => {
  const vibrate = (pattern) => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      // Silently fail if vibration is not supported
      console.log('Vibration not supported');
    }
  };

  const dragStart = () => vibrate([50]);
  const dropSuccess = () => vibrate([100, 50, 100]);
  const dropError = () => vibrate([200]);
  const hover = () => vibrate([25]);

  return {
    dragStart,
    dropSuccess,
    dropError,
    hover
  };
};
