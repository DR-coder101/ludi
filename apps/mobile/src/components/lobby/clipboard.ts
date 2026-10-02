import { Platform } from 'react-native';

type WebClipboard = { writeText: (text: string) => Promise<void> };

/**
 * Copies on web only. Native needs expo-clipboard, which is not a dependency yet,
 * so callers fall back to the share sheet (it has a Copy action).
 */
export async function copyText(text: string): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  const clipboard = (globalThis as { navigator?: { clipboard?: WebClipboard } }).navigator?.clipboard;
  if (!clipboard) return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
