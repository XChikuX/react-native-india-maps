import { Platform } from 'react-native';

/** Minimal shared theme for the example app. */
export const theme = {
  colors: {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    onPrimary: '#ffffff',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    error: '#dc2626',
    infoBg: '#eff6ff',
    infoBorder: '#bfdbfe',
    infoText: '#1e3a8a',
    warnBg: '#fffbeb',
    warnBorder: '#fde68a',
    warnText: '#92400e',
    codeBg: '#0f172a',
    codeText: '#e2e8f0',
    chipBg: '#e2e8f0',
    chipSelected: '#2563eb',
    chipSelectedText: '#ffffff',
    disabled: '#94a3b8',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
  font: {
    mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
} as const;
