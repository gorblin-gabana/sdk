

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

export default function Logo({ size = 'md', className = '', showText = false }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-14 h-14'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Enhanced Logo Design - replace with /logo.png when available */}
      <div className={`
        ${sizeClasses[size]} 
        bg-gradient-to-br from-gorbchain-primary via-gorbchain-secondary to-gorbchain-accent 
        rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden
      `}>
        <img 
          src="/logo.png" 
          alt="Gorbchain Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {showText && (
        <div>
          <h1 className={`font-bold text-gorbchain-dark leading-tight ${
            size === 'lg' ? 'text-xl' : size === 'md' ? 'text-lg' : 'text-base'
          }`}>
            SDK
          </h1>
          <p className={`text-gray-500 -mt-0.5 ${
            size === 'lg' ? 'text-sm' : 'text-xs'
          }`}>
            Documentation
          </p>
        </div>
      )}
    </div>
  )
} 