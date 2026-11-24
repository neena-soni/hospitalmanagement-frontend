import logoImg from '../../assets/logo3.png'

export default function Logo({ size = 'md', className = '' }) {
  // Sized generously so the wordmark and fine details are crystal-clear
  const sizeClasses = {
    sm: 'h-20 md:h-24',
    md: 'h-28 md:h-36',
    lg: 'h-36 md:h-44',
  }

  return (
    <div className={`inline-flex items-center -ml-3 -my-3 ${className}`}>
      <img
        src={logoImg}
        alt="Hospital Management Logo"
        className={`${sizeClasses[size] || sizeClasses.md} w-auto object-contain select-none`}
      />
    </div>
  )
}