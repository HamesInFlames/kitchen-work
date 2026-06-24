import type { SVGProps } from 'react'

// Small inline icon set (no icon dependency, so it works fully offline).
// Stroke icons inherit `currentColor`.

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const DropletIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.2s6 6.3 6 10.3a6 6 0 0 1-12 0c0-4 6-10.3 6-10.3Z" fill="currentColor" stroke="none" />
  </Svg>
)

export const WheatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 22V8" />
    <path d="M12 8c0-2.2 1.8-4 4-4 0 2.2-1.8 4-4 4Z" />
    <path d="M12 8c0-2.2-1.8-4-4-4 0 2.2 1.8 4 4 4Z" />
    <path d="M12 13c0-2.2 1.8-4 4-4 0 2.2-1.8 4-4 4Z" />
    <path d="M12 13c0-2.2-1.8-4-4-4 0 2.2 1.8 4 4 4Z" />
    <path d="M12 18c0-2.2 1.8-4 4-4 0 2.2-1.8 4-4 4Z" />
    <path d="M12 18c0-2.2-1.8-4-4-4 0 2.2 1.8 4 4 4Z" />
  </Svg>
)

export const BowlIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 11h18a9 9 0 0 1-18 0Z" />
    <path d="M12 11c2-2 1-4-1-5" />
    <path d="M8 11c1.5-1.5 1-3-.5-4" />
  </Svg>
)

export const TimerIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2" />
    <path d="M9 2h6" />
  </Svg>
)

export const CameraIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8.5A2 2 0 0 1 5 6.5h1.5l1-2h7l1 2H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <circle cx="12" cy="13" r="3.2" />
  </Svg>
)

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const MinusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
)

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5 10 17l9-10" />
  </Svg>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const FlameIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.5-2 1-2.7C9.8 9.6 11 8 12 3Z" fill="currentColor" stroke="none" />
    <path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4.5-9 .3 4-2 5.2-3.5 6.5C8.5 14 8 15 8 16a4 4 0 0 0 4 5Z" />
  </Svg>
)

export const BookIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z" />
  </Svg>
)

export const GearIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
  </Svg>
)

export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Svg>
)

export const PencilIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16Z" />
    <path d="M14 6l4 4" />
  </Svg>
)

export const TextSizeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17 7 6l4 11M4.5 13.5h5" />
    <path d="M13 17l3-7 3 7M14 14.5h4" />
  </Svg>
)

export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12M7 11l5 5 5-5" />
    <path d="M4 20h16" />
  </Svg>
)

export const UploadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21V9M7 13l5-5 5 5" />
    <path d="M4 4h16" />
  </Svg>
)

export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p}>
    <path
      d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9Z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Svg>
)

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
)

export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Svg>
)

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </Svg>
)

export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
)

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
    <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
  </Svg>
)

export const NoteIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3h9l4 4v14H6Z" />
    <path d="M15 3v4h4M9 12h7M9 16h5" />
  </Svg>
)
