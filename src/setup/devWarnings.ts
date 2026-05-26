import { LogBox, Platform } from 'react-native';

/** Upstream libs (e.g. React Navigation) still set pointerEvents as a View prop. */
const POINTER_EVENTS_DEPRECATION = 'props.pointerEvents is deprecated';

export function configureDevWarnings() {
  LogBox.ignoreLogs([POINTER_EVENTS_DEPRECATION]);

  if (Platform.OS !== 'web' || typeof console === 'undefined') return;

  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const first = args[0];
    const message =
      typeof first === 'string'
        ? first
        : first != null && typeof first === 'object' && 'message' in first
          ? String((first as { message: unknown }).message)
          : String(first ?? '');

    if (message.includes('pointerEvents is deprecated')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
