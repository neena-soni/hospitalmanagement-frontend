import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${maxWidth} rounded-card bg-canvas p-6 md:p-8 shadow-2xl border border-ink/10 z-10 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-ink/10">
          <h3 className="font-display text-2xl text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ink/50 hover:text-ink hover:bg-sand transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
