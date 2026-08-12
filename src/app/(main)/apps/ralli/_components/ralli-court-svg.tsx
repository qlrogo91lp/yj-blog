type Props = {
  className?: string;
};

export function RalliCourtSvg({ className }: Props) {
  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={className}
    >
      <g fill="none" stroke="rgba(200,255,61,0.30)" strokeWidth="1.6">
        <path d="M120 560 L680 560 L560 200 L240 200 Z" />
        <path d="M170 420 L630 420" />
        <path d="M255 310 L545 310" />
        <path d="M400 200 L400 560" />
        <path d="M240 200 L560 200" />
      </g>
      <path
        d="M100 200 L700 200"
        stroke="rgba(242,245,240,0.28)"
        strokeWidth="2.5"
        strokeDasharray="4 7"
      />
    </svg>
  );
}
