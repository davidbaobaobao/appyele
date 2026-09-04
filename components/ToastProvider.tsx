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
      bg: 'rgba(31,122,85,0.10)',
      border: 'rgba(31,122,85,0.28)',
      color: '#1F7A55',
    },
    error: {
      bg: 'rgba(179,56,43,0.09)',
      border: 'rgba(179,56,43,0.28)',
      color: '#B3382B',
    },
    info: {
      bg: 'rgba(212,111,200,0.12)',
      border: 'rgba(212,111,200,0.32)',
      color: '#D46FC8',
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
                className="px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto"
                style={{
                  backgroundColor: style.bg,
                  border: `1px solid ${style.border}`,
                  color: style.color,
                  minWidth: '220px',
                  borderRadius: '14px',
                  backdropFilter: 'blur(8px)',
                  fontFamily: 'var(--font-instrument)',
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
