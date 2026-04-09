'use client'

import { createContext, useContext, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const TOAST_STYLES: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: {
      bg: 'rgba(42,138,90,0.15)',
      border: 'rgba(42,138,90,0.4)',
      color: '#2A8A5A',
    },
    error: {
      bg: 'rgba(196,58,42,0.15)',
      border: 'rgba(196,58,42,0.4)',
      color: '#C43A2A',
    },
    info: {
      bg: 'rgba(232,160,32,0.15)',
      border: 'rgba(232,160,32,0.4)',
      color: '#E8A020',
    },
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = TOAST_STYLES[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-3 rounded-xl text-sm font-medium shadow-lg pointer-events-auto"
                style={{
                  backgroundColor: style.bg,
                  border: `1px solid ${style.border}`,
                  color: style.color,
                  minWidth: '220px',
                }}
              >
                {toast.message}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
