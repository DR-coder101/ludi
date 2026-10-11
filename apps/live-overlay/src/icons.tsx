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

const USERS_SOLID =
  'M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z';

const LIST_OL =
  'M24 56c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24l0 120 16 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l16 0 0-96-8 0C34.7 80 24 69.3 24 56zM86.7 341.2c-6.5-7.4-18.3-6.9-24 1.2L51.5 357.9c-7.7 10.8-22.7 13.3-33.5 5.6s-13.3-22.7-5.6-33.5l11.1-15.6c23.7-33.2 72.3-35.6 99.2-4.9c21.3 24.4 20.8 60.9-1.1 84.7L86.8 432l33.2 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-88 0c-9.5 0-18.2-5.6-22-14.4s-2.1-18.9 4.3-25.9l72-78c5.3-5.8 5.4-14.6 .3-20.5zM224 64l256 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 160l256 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 160l256 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z';

const USER_CLOCK =
  'M224 0a128 128 0 1 1 0 256A128 128 0 1 1 224 0zM178.3 304l91.4 0c20.6 0 40.4 3.5 58.8 9.9C323 331 320 349.1 320 368c0 59.5 29.5 112.1 74.8 144L29.7 512C13.3 512 0 498.7 0 482.3C0 383.8 79.8 304 178.3 304zM352 368a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-80c-8.8 0-16 7.2-16 16l0 64c0 8.8 7.2 16 16 16l48 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0 0-48c0-8.8-7.2-16-16-16z';

const TROPHY_FA =
  'M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z';

const CHECK_SOLID =
  'M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z';

const LEAVE_DOOR =
  'M23 17c0 3.31-2.69 6-6 6v-1.5c2.48 0 4.5-2.02 4.5-4.5zM1 7c0-3.31 2.69-6 6-6v1.5C4.52 2.5 2.5 4.52 2.5 7zm7.01-2.68-4.6 4.6c-3.22 3.22-3.22 8.45 0 11.67s8.45 3.22 11.67 0l7.07-7.07c.49-.49.49-1.28 0-1.77a1.25 1.25 0 0 0-1.77 0l-4.42 4.42-.71-.71 6.54-6.54c.49-.49.49-1.28 0-1.77s-1.28-.49-1.77 0l-5.83 5.83-.71-.71 6.89-6.89c.49-.49.49-1.28 0-1.77s-1.28-.49-1.77 0l-6.89 6.89-.69-.7 5.48-5.48c.49-.49.49-1.28 0-1.77s-1.28-.49-1.77 0l-7.62 7.62a4 4 0 0 1-.33 5.28l-.71-.71a3 3 0 0 0 0-4.24l-.35-.35 4.07-4.07c.49-.49.49-1.28 0-1.77a1.27 1.27 0 0 0-1.78.01';

const GIFT_FA =
  'M281.31 21.217L239.997 127.13l76.01 103.673 97.135-7.532-3.1-79.284-78.2-12.468-1.61 41.535 29.11 7.568-.766-14.1 18.662-1.012 2.15 39.635-68.41-17.788 3.004-77.61 68.65 10.946-2.456-86.044-98.863-13.43zM243.63 66.39l-73.702 39.917L195.885 243.7l141.306 80.704 154.447-80.037-11.252-142.205-79.617-.988.642 22.512 26.705 4.257 4.403 112.57-125.436 9.727-88.227-120.338 24.774-63.51zm-93.107 88.706c-2.992-.017-6.01.004-9.054.06-9.456.174-19.425.853-29.44 1.594 9.427 13.32 18.694 26.165 30.157 35.938 7.894 6.73 16.835 12.308 28.075 16.056l-10.1-53.453c-3.184-.11-6.396-.176-9.64-.194zm25.57 84.51c-14.278 5.27-27.16 13.25-39.437 23.55-17.875 14.995-34.273 35.22-50.625 58.47 56.9 2.6 100.16-6.41 147.316-35.01l-54.223-30.966-3.03-16.045zm270.854 48.968l-50.64 26.244c27.874 20.83 54.865 27.206 90.162 28.557-8.76-21.213-22.617-39.484-39.523-54.8zm-189.853 4.895c-14.566 9.75-28.84 17.8-43.156 24.342.37 10.843 2.813 19.703 6.968 26.47-29.49 37.69-61.714 72.017-96.78 102.843-17.584-1.215-24.577-19.137-17.845-37.344-22.758 18.074-30.427 42.166-20 68.376-6.832 5.23-13.75 10.354-20.78 15.344h45.344c25.65-20.11 49.915-41.82 72.844-65.094 29.485 9.192 54.05-1.51 69.625-27.97-14.975 8.052-31.217 5.627-37.438-6.686 9.653-11.06 19.037-22.436 28.156-34.125 7.25 1.21 15.586.57 24.72-2.03-8.863-17.974-13.326-39.19-11.656-64.126zm18.133 17.065c1.205 25.213 10.463 44.01 24.648 60.12 17.914 20.346 44.73 35.942 73.625 50.814 7.79-33.575 9.555-62.664-2.05-93.77l-34.692 17.978-61.53-35.143z';

export function UsersIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 640 512" fill={color} aria-hidden>
      <path d={USERS_SOLID} />
    </svg>
  );
}

export function ListOlIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 512 512" fill={color} aria-hidden>
      <path d={LIST_OL} />
    </svg>
  );
}

export function UserClockIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 640 512" fill={color} aria-hidden>
      <path d={USER_CLOCK} />
    </svg>
  );
}

export function LeaveIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d={LEAVE_DOOR} />
    </svg>
  );
}

export function ClockIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function BoltIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function GiftIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 512 512" fill={color} aria-hidden>
      <path d={GIFT_FA} />
    </svg>
  );
}

export function CheckIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 448 512" fill={color} aria-hidden>
      <path d={CHECK_SOLID} />
    </svg>
  );
}

export function TrophyIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 576 512" fill={color} aria-hidden>
      <path d={TROPHY_FA} />
    </svg>
  );
}

export function DieFiveIcon({ size = 78, color = '#fff6e3', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 448 512" fill={color} aria-hidden>
      <path d="M0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zm160 64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM128 288a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32 64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM320 192a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32 64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM320 384a32 32 0 1 0 0-64 32 32 0 1 0 0 64z" />
    </svg>
  );
}

export function DieFiveAltIcon({ size = 62, color = '#fff6e3', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 448 512" fill={color} aria-hidden>
      <path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm64 96a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM96 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM224 224a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm64-64a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32 160a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
    </svg>
  );
}

export function UserPlusIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6M23 11h-6" />
    </svg>
  );
}
