type IconProps = {
  size?: number;
  color?: string;
  className?: string;
};

const CROWN =
  'M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z';

export function CrownIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 576 512" fill={color} aria-hidden>
      <path d={CROWN} />
    </svg>
  );
}

export function CheckIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function CopyIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function RefreshIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" aria-hidden>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function PencilIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function UsersIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function ClockIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function GiftIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v9H5v-9" />
      <path d="M7.5 8a2.5 2.5 0 1 1 4.5-2c0 2-4.5 2-4.5 4" />
      <path d="M16.5 8a2.5 2.5 0 1 0-4.5-2c0 2 4.5 2 4.5 4" />
    </svg>
  );
}

export function PauseIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function PlayIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function SkipIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M5 5v14l9-7z" />
      <rect x="16" y="5" width="3" height="14" rx="1" />
    </svg>
  );
}

export function RestartIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export function KickIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5" />
      <path d="M16 11l5 5M21 11l-5 5" />
    </svg>
  );
}

export function WarnIcon({ size = 36, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16.5" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}

export function LockIcon({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function UploadIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <path d="M12 16V6" />
      <path d="M7 11l5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function PlugIcon({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <path d="M9 7v6" />
      <path d="M15 7v6" />
      <path d="M8 13h8v2a4 4 0 0 1-8 0v-2z" />
      <path d="M12 19v3" />
    </svg>
  );
}
