export interface Beach {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  stationId?: string;
  waterTempStationId?: string;
  imageUrl?: string | number;
  cameraUrl?: string;
  cameraType?: 'direct' | 'nearby';
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
}

export interface TideData {
  time: string;
  height: number;
  type: 'high' | 'low';
}

export interface SurfData {
  height: number;
  period: number;
  direction: string;
}

export interface WaterQuality {
  temperature: number;
  salinity?: number;
}

export interface SunData {
  sunrise: string;
  sunset: string;
}

export interface Alert {
  id: string;
  type: 'weather' | 'surf' | 'wind' | 'marine' | 'water';
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  title: string;
  description: string;
  value?: string;
  threshold?: string;
}

export interface BeachConditions {
  beach: Beach;
  weather: WeatherData;
  tides: TideData[];
  surf: SurfData;
  waterQuality: WaterQuality;
  sunData: SunData;
  flagWarning: 'green' | 'yellow' | 'red' | 'purple' | 'none';
  warningMessage?: string;
  alerts: Alert[];
  lastUpdated: string;
}

export interface BeachSearchResult {
  beach: Beach;
  distance?: number;
}
