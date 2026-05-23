type OvulatorySparkIconProps = {
  className?: string
}

export default function OvulatorySparkIcon({ className = '' }: OvulatorySparkIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 6L36.8 22.9L53.7 18.1L41.9 32L53.7 45.9L36.8 41.1L32 58L27.2 41.1L10.3 45.9L22.1 32L10.3 18.1L27.2 22.9L32 6Z"
        fill="currentColor"
      />
      <circle cx="32" cy="32" r="7.5" fill="white" fillOpacity="0.34" />
    </svg>
  )
}