interface Props {
  className?: string
  size?: number
}

export function LockIcon({ className, size = 14 }: Props) {
  const height = (size * 43) / 35

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 35 43"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M22.4821 28.5H22.5M12.5 28.5H12.5179"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.03562 35.1895C2.48538 38.53 5.25226 41.147 8.61932 41.3018C11.4525 41.4321 14.3306 41.5 17.5 41.5C20.6694 41.5 23.5475 41.4321 26.3807 41.3018C29.7477 41.147 32.5146 38.53 32.9644 35.1895C33.2579 33.0094 33.5 30.7752 33.5 28.5C33.5 26.2248 33.2579 23.9906 32.9644 21.8105C32.5146 18.47 29.7477 15.853 26.3807 15.6982C23.5475 15.5679 20.6694 15.5 17.5 15.5C14.3306 15.5 11.4525 15.5679 8.61932 15.6982C5.25226 15.853 2.48538 18.47 2.03562 21.8105C1.74209 23.9906 1.5 26.2248 1.5 28.5C1.5 30.7752 1.74209 33.0094 2.03562 35.1895Z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M8.5 15.5V10.5C8.5 5.52944 12.5294 1.5 17.5 1.5C22.4706 1.5 26.5 5.52944 26.5 10.5V15.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
