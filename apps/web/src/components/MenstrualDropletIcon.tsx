type MenstrualDropletIconProps = {
  className?: string
}

export default function MenstrualDropletIcon({ className = '' }: MenstrualDropletIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 6C27.1 15 16 27.3 16 38.1C16 49.2 24.2 58 32 58C39.8 58 48 49.2 48 38.1C48 27.3 36.9 15 32 6Z"
        fill="currentColor"
      />
      <path
        d="M28.2 24.1C24.9 28.7 22.8 33.8 22.8 38.5C22.8 45.3 27.6 50.7 32 50.7C35.5 50.7 38.6 47.9 40.1 44.2C38 45.1 35.4 45.5 32.7 45.5C28.1 45.5 24.9 42 24.9 37.6C24.9 33.1 26.8 28.2 28.2 24.1Z"
        fill="white"
        fillOpacity="0.38"
      />
    </svg>
  )
}