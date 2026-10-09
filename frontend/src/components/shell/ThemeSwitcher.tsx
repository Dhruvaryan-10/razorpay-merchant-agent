'use client';

import { useEffect, useState } from 'react';
import { Segmented } from '@/components/ui/Segmented';
import { applyThemePreference, readThemePreference, type ThemePreference } from '@/lib/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
];

export function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>('system');
  useEffect(() => {
    setPreference(readThemePreference());
    const onChange = () => setPreference(readThemePreference());
    window.addEventListener('rma-theme', onChange);
    return () => window.removeEventListener('rma-theme', onChange);
  }, []);
  const choose = (value: ThemePreference) => {
    applyThemePreference(value);
    setPreference(value);
    window.dispatchEvent(new Event('rma-theme'));
  };
  return [preference, choose] as const;
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const [preference, choose] = useThemePreference();
  return <Segmented label="Theme" options={OPTIONS} value={preference} onChange={choose} className={className} />;
}
