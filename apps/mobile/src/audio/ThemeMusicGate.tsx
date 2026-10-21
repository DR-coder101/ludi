import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { gameAudio } from '../utils/gameAudio';
import { surfaceFromPath, type AppPresence } from './music';

function presenceOf(state: string): AppPresence {
  return state === 'active' ? 'active' : 'background';
}

export function ThemeMusicGate() {
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    let cancelled = false;
    void gameAudio.initialize().then(() => {
      if (cancelled) return;
      void gameAudio.setPresence(presenceOf(AppState.currentState));
      void gameAudio.setSurface(surfaceFromPath(pathname));
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      void gameAudio.setPresence(presenceOf(next));
    });
    return () => sub.remove();
  }, []);

  return null;
}
