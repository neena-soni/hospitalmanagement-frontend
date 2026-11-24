export default function Card({ children, className = '', padded = true }) {
  return (
    <div
      className={`rounded-card bg-canvas/95 backdrop-blur-sm shadow-soft border border-ink/5 ${
        padded ? 'p-6 md:p-8' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
