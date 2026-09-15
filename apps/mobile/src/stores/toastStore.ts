import { create } from 'zustand';
import type { ToastType } from '../components/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastStore extends ToastState {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  visible: false,
  message: '',
  type: 'info',
  duration: 3000,
  showToast: (message, type = 'info', duration = 3000) =>
    set({ visible: true, message, type, duration }),
  hideToast: () => set({ visible: false }),
}));
