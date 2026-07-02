const flagModules = import.meta.glob<string>(
  '../../node_modules/flag-icons/flags/4x3/*.svg',
  { eager: true, query: '?url', import: 'default' },
)

const FLAG_URL_BY_CODE = Object.fromEntries(
  Object.entries(flagModules).map(([path, url]) => {
    const code = path.match(/\/([^/]+)\.svg$/)?.[1] ?? ''
    return [code, url]
  }),
) as Record<string, string>

interface Props {
  code: string
  className?: string
  style?: React.CSSProperties
  title?: string
}

export function TeamFlag({ code, className, style, title }: Props) {
  const src = FLAG_URL_BY_CODE[code]
  if (!src) return null

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      title={title}
      className={className}
      style={{
        width: '1.333em',
        height: '1em',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: '-0.15em',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
