import Image from 'next/image'

interface DuckIconProps {
  className?: string
  size?: number
}

export function DuckIcon({ className = "", size = 24 }: DuckIconProps) {
  return (
    <Image
      src="/duck-icon.png"
      alt="Duck"
      width={size}
      height={size}
      className={`${className} pixelated`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}