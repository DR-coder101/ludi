import type { ImageSourcePropType } from 'react-native';
import type { DieFace } from './dieFace';

export const DIE_SHADOW_SOURCE = require('../../../assets/dice/shadow.png') as ImageSourcePropType;

export const DIE_FACE_SOURCE: Record<DieFace, ImageSourcePropType> = {
  1: require('../../../assets/dice/face-1.png'),
  2: require('../../../assets/dice/face-2.png'),
  3: require('../../../assets/dice/face-3.png'),
  4: require('../../../assets/dice/face-4.png'),
  5: require('../../../assets/dice/face-5.png'),
  6: require('../../../assets/dice/face-6.png'),
};

export function dieFaceSource(face: DieFace): ImageSourcePropType {
  switch (face) {
    case 1:
      return DIE_FACE_SOURCE[1];
    case 2:
      return DIE_FACE_SOURCE[2];
    case 3:
      return DIE_FACE_SOURCE[3];
    case 4:
      return DIE_FACE_SOURCE[4];
    case 5:
      return DIE_FACE_SOURCE[5];
    case 6:
      return DIE_FACE_SOURCE[6];
    default: {
      const _never: never = face;
      return _never;
    }
  }
}
