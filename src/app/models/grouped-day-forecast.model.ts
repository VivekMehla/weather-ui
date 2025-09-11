import { HourlyWeatherEntry } from './hourly-weather-entry.model';

export interface GroupedDayForecast {
  date: string;
  hours: HourlyWeatherEntry[];
}