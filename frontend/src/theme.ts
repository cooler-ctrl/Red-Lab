import type { AppMode } from './types';

export const theme = {
  bg: {
    main: '#0B0D12',
    secondary: '#11151D',
    panel: '#171C26',
    card: '#1F2633',
  },
  border: '#293140',
  text: {
    primary: '#F3F5F8',
    secondary: '#9BA5B5',
    muted: '#6B7280',
  },
  severity: {
    critical: '#FF3B4E',
    high: '#FF8A4C',
    medium: '#F5C451',
    low: '#60A5FA',
    secure: '#34D399',
  },
  modes: {
    attack: {
      mode: 'attack' as const,
      label: 'ATTACK MODE',
      subtitle: 'Red Team Offense & Reconnaissance',
      accent: '#FF3B4E',
      accentHover: '#E02B3E',
      accentMuted: 'rgba(255, 59, 78, 0.15)',
      accentBorder: 'rgba(255, 59, 78, 0.45)',
      badgeBg: 'rgba(255, 59, 78, 0.12)',
      badgeText: '#FF3B4E',
      canvasGlow: '0 0 25px rgba(255, 59, 78, 0.12)',
      edgeColor: '#FF3B4E',
      bannerBg: 'bg-[#FF3B4E]/10',
      bannerBorder: 'border-[#FF3B4E]/30',
      bannerText: 'text-[#FF3B4E]',
    },
    defend: {
      mode: 'defend' as const,
      label: 'DEFEND MODE',
      subtitle: 'Blue Team Hardening & Verification',
      accent: '#3B82F6',
      accentHover: '#2563EB',
      accentMuted: 'rgba(59, 130, 246, 0.15)',
      accentBorder: 'rgba(59, 130, 246, 0.45)',
      badgeBg: 'rgba(59, 130, 246, 0.12)',
      badgeText: '#60A5FA',
      canvasGlow: '0 0 25px rgba(59, 130, 246, 0.12)',
      edgeColor: '#3B82F6',
      bannerBg: 'bg-[#3B82F6]/10',
      bannerBorder: 'border-[#3B82F6]/30',
      bannerText: 'text-[#60A5FA]',
    },
  },
} as const;

export function getModeTheme(mode: AppMode) {
  return theme.modes[mode] || theme.modes.attack;
}
