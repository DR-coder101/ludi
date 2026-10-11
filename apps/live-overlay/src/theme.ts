export const CANVAS = {
  width: 1080,
  height: 1920,
} as const;

export const SAFE_ZONE = {
  x0: 100,
  x1: 980,
  y0: 40,
  y1: 1380,
} as const;

export const TOWN = {
  kingston: {
    id: 'kingston' as const,
    label: 'KINGSTON',
    title: 'Kingston',
    hex: '#E4202E',
    bright: '#FF3340',
    tint: '#FFE0E2',
    deep: '#16090B',
    pieceHi: '#FF9AA0',
    pieceLo: '#7A0710',
    border: null as string | null,
  },
  ochoRios: {
    id: 'ochoRios' as const,
    label: 'OCHO RIOS',
    title: 'Ocho Rios',
    hex: '#0FAE47',
    bright: '#19C45A',
    tint: '#D8FFE6',
    deep: '#07140C',
    pieceHi: '#7CF2A4',
    pieceLo: '#005C22',
    border: null as string | null,
  },
  montegoBay: {
    id: 'montegoBay' as const,
    label: 'MONTEGO BAY',
    title: 'Montego Bay',
    hex: '#FED100',
    bright: '#FED100',
    tint: '#FFF8D0',
    deep: '#141104',
    pieceHi: '#FFF3A0',
    pieceLo: '#A88400',
    border: null as string | null,
  },
  negril: {
    id: 'negril' as const,
    label: 'NEGRIL',
    title: 'Negril',
    hex: '#26272B',
    bright: '#D9DCE1',
    tint: '#C9CDD4',
    deep: '#111214',
    pieceHi: '#7A7D84',
    pieceLo: '#050506',
    border: '#D9DCE1' as string | null,
  },
} as const;

export const FLAG = {
  gold: '#FED100',
  green: '#009B3A',
  black: '#0B0B0C',
  ink: '#111111',
  cream: '#F3E7C9',
  creamLight: '#F6EFD9',
  creamWarm: '#FFF6E3',
  livePink: '#FF3B7F',
  giftPink: '#FF3B6B',
  canvas: '#0B2A1A',
  sticker: 'rgb(122, 74, 18)',
} as const;

export const FONT = "'Baloo 2', Fredoka, Inter, sans-serif";
export const WEIGHT_BLACK = 800;
export const WEIGHT_BOLD = 700;
export const WEIGHT_SEMI = 600;

export const BADGE_WINNER_CAN_STAY = 'WINNER CAN STAY';
