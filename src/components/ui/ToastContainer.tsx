import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { ToastNotification } from '../../types';

interface ToastContainerProps {
  toasts: ToastNotification[];
  removeToast: (id: number) => void;
}

export const ToastContainer = ({ toasts, removeToast: _removeToast }: ToastContainerProps) => (
  <div className="fixed left-0 right-0 flex flex-col items-center gap-2 z-[1000] pointer-events-none px-4 overflow-hidden" style={{ bottom: 'calc(max(var(--bottom-nav-total-h, 0px), var(--web-bottom-nav-h, 0px), env(safe-area-inset-bottom, 0px)) + var(--page-cta-bar-h, 0px) + 1rem)', maxHeight: '40dvh' }}>
    <AnimatePresence mode='popLayout'>
      {toasts.map(toast => (
        <motion.div
          layout
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`pointer-events-auto px-6 py-3 rounded-full shadow-xl flex items-center gap-3 text-white font-medium backdrop-blur-sm ${
            toast.className 
              ? toast.className 
              : toast.type === 'success' 
                ? 'bg-[#6366F1]' 
                : toast.type === 'error' 
                  ? 'bg-red-500' 
                  : 'bg-gray-800'
          }`}
        >
          {/* Jeśli przekazano własną ikonę, użyj jej. Jeśli nie - standardowe. */}
          {toast.icon ? (
             toast.icon
          ) : (
             <>
                {toast.type === 'success' && <CheckCircle size={18} />}
                {toast.type === 'error' && <XCircle size={18} />}
                {toast.type === 'info' && <AlertCircle size={18} />}
             </>
          )}
          
          <span className="whitespace-nowrap">{toast.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);