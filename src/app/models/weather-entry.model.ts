export interface WeatherEntry {
  date: string;
  minTemp: number;
  maxTemp: number;
  maxWind: number;
  rain: boolean;
  thunderstorm: boolean;
  prediction: string;
}
