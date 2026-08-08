/**
 * WMO weather-interpretation codes → human label + emoji.
 * https://open-meteo.com/en/docs (WMO Weather interpretation codes, WW)
 * Kept provider-agnostic: any provider that reports WMO codes can reuse this.
 */
import type { WeatherCode } from './types';

const TABLE: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Clear', emoji: '☀️' },
  1: { label: 'Mostly sunny', emoji: '🌤️' },
  2: { label: 'Partly cloudy', emoji: '⛅' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Foggy', emoji: '🌫️' },
  48: { label: 'Foggy', emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle', emoji: '🌦️' },
  55: { label: 'Heavy drizzle', emoji: '🌧️' },
  56: { label: 'Freezing drizzle', emoji: '🌧️' },
  57: { label: 'Freezing drizzle', emoji: '🌧️' },
  61: { label: 'Light rain', emoji: '🌦️' },
  63: { label: 'Rain', emoji: '🌧️' },
  65: { label: 'Heavy rain', emoji: '🌧️' },
  66: { label: 'Freezing rain', emoji: '🌧️' },
  67: { label: 'Freezing rain', emoji: '🌧️' },
  71: { label: 'Light snow', emoji: '🌨️' },
  73: { label: 'Snow', emoji: '🌨️' },
  75: { label: 'Heavy snow', emoji: '❄️' },
  77: { label: 'Snow grains', emoji: '🌨️' },
  80: { label: 'Light showers', emoji: '🌦️' },
  81: { label: 'Showers', emoji: '🌧️' },
  82: { label: 'Heavy showers', emoji: '⛈️' },
  85: { label: 'Snow showers', emoji: '🌨️' },
  86: { label: 'Snow showers', emoji: '🌨️' },
  95: { label: 'Thunderstorms', emoji: '⛈️' },
  96: { label: 'Thunderstorms', emoji: '⛈️' },
  99: { label: 'Thunderstorms', emoji: '⛈️' },
};

export function weatherFromCode(code: number | null | undefined): WeatherCode | null {
  if (code == null) return null;
  const hit = TABLE[code] ?? { label: 'Unsettled', emoji: '🌥️' };
  return { code, label: hit.label, emoji: hit.emoji };
}

/** True for codes that involve precipitation (drizzle/rain/showers/snow/storms). */
export function isWetCode(code: number | null | undefined): boolean {
  if (code == null) return false;
  return code >= 51;
}
