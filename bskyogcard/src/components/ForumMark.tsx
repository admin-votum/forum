export function ForumMark(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 64 57"
      {...props}>
      <path
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        d="M17 13 L17 30 A15 15 0 0 0 47 30 L47 13"
      />
      <circle cx="26" cy="26.5" r="2.9" fill="#FF9F1C" />
      <circle cx="38" cy="26.5" r="2.9" fill="#FF9F1C" />
    </svg>
  )
}
