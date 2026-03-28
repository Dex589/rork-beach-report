import { Beach, BeachConditions, TideData, SurfData, WeatherData, WaterQuality, SunData, Alert } from '@/types/beach';

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_MARINE_API = 'https://marine-api.open-meteo.com/v1/marine';
const SUNRISE_SUNSET_API = 'https://api.sunrise-sunset.org/json';
const NOAA_TIDES_API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

export async function fetchBeachConditions(beach: Beach): Promise<BeachConditions> {
  try {
    console.log('[BeachAPI] Fetching conditions for:', beach.name);
    const [weatherData, sunData, tideData, surfData, waterQuality] = await Promise.all([
      fetchWeatherData(beach.latitude, beach.longitude),
      fetchSunData(beach.latitude, beach.longitude),
      fetchTideData(beach),
      fetchSurfData(beach.latitude, beach.longitude),
      fetchWaterQuality(beach),
    ]);
    console.log('[BeachAPI] All data fetched successfully for:', beach.name);


    const alerts = generateAlerts(weatherData, surfData, waterQuality);
    const flagWarning = determineFlag(alerts);

    return {
      beach,
      weather: weatherData,
      tides: tideData,
      surf: surfData,
      waterQuality,
      sunData,
      flagWarning,
      warningMessage: getWarningMessage(flagWarning),
      alerts,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[BeachAPI] Error fetching beach conditions for', beach.name, ':', error);
    throw error;
  }
}

async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  try {
    const url = `${OPEN_METEO_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,uv_index&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    const current = data.current;
    
    return {
      temperature: Math.round(current.temperature_2m),
      condition: getWeatherCondition(current.weather_code),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: getWindDirection(current.wind_direction_10m),
      uvIndex: Math.round(current.uv_index || 0),
    };
  } catch (error) {
    console.log('Using fallback weather data due to API error');
    return {
      temperature: 75,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 10,
      windDirection: 'E',
      uvIndex: 6,
    };
  }
}

async function fetchSunData(lat: number, lon: number): Promise<SunData> {
  try {
    const url = `${SUNRISE_SUNSET_API}?lat=${lat}&lng=${lon}&formatted=0`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      sunrise: new Date(data.results.sunrise).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      sunset: new Date(data.results.sunset).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
    };
  } catch (error) {
    console.log('Using fallback sun data due to API error');
    return {
      sunrise: '6:30 AM',
      sunset: '7:45 PM',
    };
  }
}

async function fetchTideData(beach: Beach): Promise<TideData[]> {
  if (!beach.stationId) {
    console.log('[Tides] No station ID for beach, using fallback tide data');
    return getFallbackTideData();
  }

  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');

    const url = `${NOAA_TIDES_API}?product=predictions&application=NOS.COOPS.TAC.WL&begin_date=${dateStr}&range=48&datum=MLLW&station=${beach.stationId}&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

    console.log('[Tides] Fetching for station', beach.stationId, 'URL:', url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('[Tides] HTTP error:', response.status);
      const errorText = await response.text();
      console.log('[Tides] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('[Tides] Response received for', beach.name, '- predictions count:', data?.predictions?.length || 0);
    console.log('[Tides] First prediction:', data?.predictions?.[0]);

    if (data?.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
      const predictions = data.predictions
        .map((pred: { t?: string; v?: string; type?: 'H' | 'L' }) => {
          const iso = pred?.t ?? '';
          const d = new Date(iso);
          const height = parseFloat(pred?.v ?? '0');
          const type = pred?.type === 'H' ? ('high' as const) : ('low' as const);
          return { date: d, height, type };
        })
        .filter((p: { date: Date; height: number; type: 'high' | 'low' }) => !isNaN(p.date.getTime()))
        .sort((a: { date: Date }, b: { date: Date }) => a.date.getTime() - b.date.getTime());

      console.log('[Tides] Total valid predictions:', predictions.length);

      const upcoming = predictions.filter((p: { date: Date }) => p.date.getTime() >= now.getTime());
      console.log('[Tides] Upcoming predictions:', upcoming.length);
      const nextFour = upcoming.slice(0, 4);

      if (nextFour.length === 4) {
        const result = nextFour.map((p: { date: Date; height: number; type: 'high' | 'low' }) => ({
          time: p.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          height: p.height,
          type: p.type,
        }));
        console.log('[Tides] Returning 4 upcoming tides:', result);
        return result;
      }

      const needed = 4 - nextFour.length;
      const previous = predictions.filter((p: { date: Date }) => p.date.getTime() < now.getTime()).slice(-needed);
      const combined = [...previous, ...nextFour].slice(0, 4);

      if (combined.length > 0) {
        const result = combined.map((p: { date: Date; height: number; type: 'high' | 'low' }) => ({
          time: p.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          height: p.height,
          type: p.type,
        }));
        console.log('[Tides] Returning combined tides:', result);
        return result;
      }
    }

    console.log('[Tides] No tide predictions in response, using fallback');
    return getFallbackTideData();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[Tides] Request timeout, using fallback');
    } else {
      console.log('[Tides] API error:', error, 'using fallback');
    }
    return getFallbackTideData();
  }
}

function getFallbackTideData(): TideData[] {
  const now = new Date();
  const tides: TideData[] = [];
  
  for (let i = 0; i < 4; i++) {
    const time = new Date(now.getTime() + i * 6 * 60 * 60 * 1000);
    tides.push({
      time: time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      height: 2 + Math.random() * 4,
      type: i % 2 === 0 ? 'high' : 'low',
    });
  }
  return tides;
}

async function fetchSurfData(lat: number, lon: number): Promise<SurfData> {
  try {
    const url = `${OPEN_METEO_MARINE_API}?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&length_unit=imperial`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    const current = data.current;
    
    return {
      height: current.wave_height || 2,
      period: current.wave_period || 10,
      direction: getWindDirection(current.wave_direction || 0),
    };
  } catch (error) {
    console.log('Using fallback surf data due to API error');
    return {
      height: 2 + Math.random() * 4,
      period: 8 + Math.random() * 6,
      direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    };
  }
}

async function fetchWaterQuality(beach: Beach): Promise<WaterQuality> {
  if (beach.waterTempStationId) {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const url = `${NOAA_TIDES_API}?product=water_temperature&application=NOS.COOPS.TAC.WL&begin_date=${dateStr}&range=1&station=${beach.waterTempStationId}&time_zone=lst_ldt&units=english&format=json`;
      
      console.log('[Water] Fetching water temp from NOAA station', beach.waterTempStationId);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log('[Water] NOAA HTTP error:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[Water] NOAA Response:', data);

      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        const latestReading = data.data[data.data.length - 1];
        const temp = parseFloat(latestReading.v);
        if (!isNaN(temp)) {
          console.log('[Water] NOAA water temperature:', temp, '°F');
          return {
            temperature: Math.round(temp),
          };
        }
      }
      
      console.log('[Water] No valid NOAA water temp data, falling back to Open-Meteo');
    } catch (error) {
      console.log('[Water] NOAA API error, falling back to Open-Meteo:', error);
    }
  }

  try {
    const url = `${OPEN_METEO_MARINE_API}?latitude=${beach.latitude}&longitude=${beach.longitude}&current=ocean_surface_temperature&temperature_unit=fahrenheit`;
    
    console.log('[Water] Fetching water temp from Open-Meteo for lat:', beach.latitude, 'lon:', beach.longitude);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('[Water] Open-Meteo Response:', data);

    if (data.current && typeof data.current.ocean_surface_temperature === 'number') {
      const temp = Math.round(data.current.ocean_surface_temperature);
      console.log('[Water] Open-Meteo water temperature:', temp, '°F');
      return {
        temperature: temp,
      };
    }
    
    console.log('[Water] No valid ocean_surface_temperature in response, using fallback');
    return {
      temperature: 72 + Math.random() * 10,
    };
  } catch (error) {
    console.log('[Water] Using fallback water quality data due to API error:', error);
    return {
      temperature: 72 + Math.random() * 10,
    };
  }
}

function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Showers';
  return 'Stormy';
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function generateAlerts(weather: WeatherData, surf: SurfData, waterQuality: WaterQuality): Alert[] {
  const alerts: Alert[] = [];

  if (weather.condition.includes('Storm')) {
    alerts.push({
      id: 'storm',
      type: 'weather',
      severity: 'extreme',
      title: 'Severe Weather Alert',
      description: 'Thunderstorms in the area. Lightning poses extreme danger.',
      value: weather.condition,
      threshold: 'No storms',
    });
  }

  if (surf.height > 8) {
    alerts.push({
      id: 'high-surf',
      type: 'surf',
      severity: 'extreme',
      title: 'Dangerous Surf Conditions',
      description: 'Extremely high waves present drowning risk. Strong rip currents likely.',
      value: `${surf.height.toFixed(1)} ft`,
      threshold: '< 8 ft',
    });
  } else if (surf.height > 5) {
    alerts.push({
      id: 'moderate-surf',
      type: 'surf',
      severity: 'moderate',
      title: 'Elevated Surf Height',
      description: 'Higher than normal waves. Inexperienced swimmers should use caution.',
      value: `${surf.height.toFixed(1)} ft`,
      threshold: '< 5 ft',
    });
  }

  if (weather.windSpeed > 25) {
    alerts.push({
      id: 'high-wind',
      type: 'wind',
      severity: 'moderate',
      title: 'High Wind Advisory',
      description: 'Strong winds may create choppy water conditions and make swimming difficult.',
      value: `${weather.windSpeed} mph ${weather.windDirection}`,
      threshold: '< 25 mph',
    });
  } else if (weather.windSpeed > 15) {
    alerts.push({
      id: 'moderate-wind',
      type: 'wind',
      severity: 'low',
      title: 'Moderate Wind',
      description: 'Breezy conditions. May affect beach umbrellas and small watercraft.',
      value: `${weather.windSpeed} mph ${weather.windDirection}`,
      threshold: '< 15 mph',
    });
  }

  if (waterQuality.temperature < 65) {
    alerts.push({
      id: 'cold-water',
      type: 'water',
      severity: 'moderate',
      title: 'Cold Water Temperature',
      description: 'Water temperature may cause hypothermia with prolonged exposure. Wetsuit recommended.',
      value: `${waterQuality.temperature.toFixed(1)}°F`,
      threshold: '> 65°F',
    });
  }

  if (weather.uvIndex > 7) {
    alerts.push({
      id: 'high-uv',
      type: 'weather',
      severity: weather.uvIndex > 10 ? 'high' : 'moderate',
      title: weather.uvIndex > 10 ? 'Extreme UV Index' : 'High UV Index',
      description: 'Unprotected skin can burn quickly. Use SPF 50+ and seek shade during peak hours.',
      value: `UV ${weather.uvIndex}`,
      threshold: '< 8',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'safe',
      type: 'weather',
      severity: 'low',
      title: 'Safe Beach Conditions',
      description: 'All conditions are within safe parameters. Enjoy your beach day!',
    });
  }

  return alerts;
}

function determineFlag(alerts: Alert[]): 'green' | 'yellow' | 'red' | 'purple' | 'none' {
  const hasExtreme = alerts.some(a => a.severity === 'extreme');
  const hasHigh = alerts.some(a => a.severity === 'high');
  const hasModerate = alerts.some(a => a.severity === 'moderate');

  if (hasExtreme) return 'red';
  if (hasHigh || hasModerate) return 'yellow';
  return 'green';
}

function getWarningMessage(flag: string): string {
  switch (flag) {
    case 'red':
      return 'Dangerous conditions - Beach closed to swimming';
    case 'yellow':
      return 'Moderate hazard - Caution advised';
    case 'purple':
      return 'Marine life warning';
    case 'green':
      return 'Safe conditions';
    default:
      return 'No warnings';
  }
}

export function getUVGuidance(uvIndex: number): string {
  if (uvIndex <= 2) return 'Low - Minimal protection needed';
  if (uvIndex <= 5) return 'Moderate - Wear sunscreen';
  if (uvIndex <= 7) return 'High - Protection essential';
  if (uvIndex <= 10) return 'Very High - Extra protection required';
  return 'Extreme - Avoid sun exposure';
}
