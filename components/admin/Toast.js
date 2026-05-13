'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * 輕量 toast 訊息系統 — 比 alert() 不打斷使用者,且可以自定樣式。
 *
 * 用法:
 *   import { useToast, ToastContainer } from '@/components/admin/Toast';
 *
 *   function MyAdminPage() {
 *     const toast = useToast();
 *     return (
 *       <>
 *         <ToastContainer />
 *         <button onClick={() => toast.success('儲存成功')}>Save</button>
 *         <button onClick={() => toast.error('儲存失敗')}>Fail</button>
 *       </>
 *     );
 *   }
 */

// 全域單一 store(讓多個元件共享同一份 toast 列表)
let listeners = [];
let toastList = [];
let nextId = 1;

function notify() {
  listeners.forEach(fn => fn([...toastList]));
}

function addToast(type, message, durationMs = 3000) {
  const id = nextId++;
  toastList.push({ id, type, message });
  notify();
  setTimeout(() => removeToast(id), durationMs);
  return id;
}

function removeToast(id) {
  toastList = toastList.filter(t => t.id !== id);
  notify();
}

export function useToast() {
  return {
    success: (msg, ms) => addToast('success', msg, ms),
    error: (msg, ms) => addToast('error', msg, ms),
    info: (msg, ms) => addToast('info', msg, ms),
    warning: (msg, ms) => addToast('warning', msg, ms),
  };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    listeners.push(setToasts);
    setToasts([...toastList]);
    return () => {
      listeners = listeners.filter(fn => fn !== setToasts);
    };
  }, []);

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '!',
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`${colors[t.type] || colors.info} border rounded-lg px-4 py-3 shadow-lg flex items-start gap-2 animate-in slide-in-from-right`}
          role="alert"
        >
          <span className="font-bold text-base shrink-0 leading-none mt-0.5">{icons[t.type] || icons.info}</span>
          <span className="text-sm flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-2 text-gray-400 hover:text-gray-700 leading-none"
            aria-label="關閉"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
