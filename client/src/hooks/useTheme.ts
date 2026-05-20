import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';

export interface ThemeSettings {
  palette_index: number;
  text_color_index: number;
}

const PALETTES: string[][] = [
  ['#ABDEE6', '#CBAACB', '#FFFFB5', '#FFCCB6', '#F3B0C3'],
  ['#C6DBDA', '#FEE1E8', '#FED7C3', '#F6EAC2', '#ECD5E3'],
  ['#FF968A', '#FFAEA5', '#FFC5BF', '#FFD8BE', '#FFC8A2'],
  ['#D4F0F0', '#8FCACA', '#CCE2CB', '#B6CFB6', '#97C1A9'],
  ['#FCB9AA', '#FFDBCC', '#ECEAE4', '#A2E1DB', '#55CBCD'],
];

const TEXT_COLORS: string[] = [
  '#2B2B2B',
  '#4A4A4A',
  '#5C3D4D',
  '#3A3A3A',
  '#5A4E4D',
  '#6B5B73',
  '#4A3A35',
  '#6B4F4F',
  '#7A3E2B',
  '#2F4F4F',
  '#3E5C50',
  '#5A6B5C',
  '#1F3A3D',
  '#365C5A',
  '#4A4A4A',
];

interface UseThemeReturn {
  palette: string[];
  textColor: string;
  loading: boolean;
}

export function useTheme(): UseThemeReturn {
  const [palette, setPalette] = useState<string[]>(PALETTES[0]);
  const [textColor, setTextColor] = useState<string>(TEXT_COLORS[0]);
  const [loading, setLoading] = useState(true);

  const fetchTheme = useCallback(async () => {
    try {
      const res = await apiClient.getTheme();
      if (res.success && res.data) {
        setPalette(PALETTES[res.data.palette_index] || PALETTES[0]);
        setTextColor(TEXT_COLORS[res.data.text_color_index] || TEXT_COLORS[0]);
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  return { palette, textColor, loading };
}
