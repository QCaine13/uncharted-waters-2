/**
 * Debug overrides for HD rendering, enabled only with ?hddebug=1.
 * Read once from location.search at module load; works in production too.
 *   ?hddebug=1&time=720   — visual time-of-day (does not change game state)
 *   ?hddebug=1&weather=rain
 *   ?hddebug=1&zoom=1.5
 */
import type { Weather } from './weather';

interface HdDebug {
  enabled: boolean;
  time: number | null;
  weather: Weather | null;
  zoom: number | null;
}

const read = (): HdDebug => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('hddebug') !== '1') {
    return { enabled: false, time: null, weather: null, zoom: null };
  }

  const time = Number(params.get('time'));
  const weather = params.get('weather');
  const zoom = Number(params.get('zoom'));

  return {
    enabled: true,
    time:
      params.get('time') !== null && time >= 0 && time <= 1439 ? time : null,
    weather: ['clear', 'cloudy', 'rain', 'fog'].includes(weather ?? '')
      ? (weather as Weather)
      : null,
    zoom: params.get('zoom') !== null && zoom >= 1 && zoom <= 2 ? zoom : null,
  };
};

const hdDebug = read();

export default hdDebug;
