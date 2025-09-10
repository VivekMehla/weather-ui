import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { WeatherService } from '../service/weather';

interface HourlyWeatherEntry {
  date: string;
  minTemp: number;
  maxTemp: number;
  maxWind: number;
  rain: boolean;
  thunderstorm: boolean;
  prediction: string;
}

interface GroupedDayForecast {
  date: string;
  hours: HourlyWeatherEntry[];
}

@Component({
  selector: 'app-forecast',
  templateUrl: './forecast.html',
  styleUrls: ['./forecast.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule]
})
export class Forecast {
  loading = false;
  error = '';
  cities: string[] = ['City A', 'City B', 'City C'];
  selectedCity: string = this.cities[0];

  forecastData: HourlyWeatherEntry[] = [
    { date: "2025-09-10 03:00:00", minTemp: 13.43, maxTemp: 13.43, maxWind: 9.19, rain: false, thunderstorm: false, prediction: "Good weather" },
    { date: "2025-09-10 06:00:00", minTemp: 13.31, maxTemp: 13.31, maxWind: 9.60, rain: false, thunderstorm: false, prediction: "Good weather" },
    { date: "2025-09-10 09:00:00", minTemp: 16.10, maxTemp: 16.10, maxWind: 12.93, rain: true, thunderstorm: false, prediction: "It’s too windy, watch out!" },
    { date: "2025-09-10 12:00:00", minTemp: 19.34, maxTemp: 19.34, maxWind: 12.06, rain: true, thunderstorm: false, prediction: "It’s too windy, watch out!" },
    { date: "2025-09-10 15:00:00", minTemp: 18.67, maxTemp: 18.67, maxWind: 9.66, rain: true, thunderstorm: false, prediction: "Carry umbrella" },
    { date: "2025-09-10 18:00:00", minTemp: 16.85, maxTemp: 16.85, maxWind: 8.48, rain: true, thunderstorm: false, prediction: "Carry umbrella" },
    { date: "2025-09-10 21:00:00", minTemp: 15.96, maxTemp: 15.96, maxWind: 8.79, rain: true, thunderstorm: false, prediction: "Carry umbrella" },
    { date: "2025-09-11 00:00:00", minTemp: 14.37, maxTemp: 14.37, maxWind: 9.91, rain: false, thunderstorm: false, prediction: "Good weather" }
  ];

  groupedForecast: GroupedDayForecast[] = [];
  selectedDayIndex: number | null = null;
  selectedDayHours: HourlyWeatherEntry[] = [];

  currentTemp: number | null = null;
  currentCity: string = this.selectedCity;
  todayMaxTemp: number | null = null;
  todayMinTemp: number | null = null;

  currentDateTimeString: string = '';

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    this.groupByDay(this.forecastData);
    this.updateCurrentDateTime();
    setInterval(() => {
      this.updateCurrentDateTime();
    }, 60000);

    if (this.groupedForecast.length > 0) {
      this.selectedDayIndex = 0;
      this.selectedDayHours = this.groupedForecast[0].hours;
      this.updateCurrentWeatherDisplay();
    }
  }

  updateCurrentDateTime() {
    const now = new Date();
    const day = now.toLocaleDateString(undefined, { weekday: 'long' });
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.currentDateTimeString = `${day} ${time}`;
  }

  fetchForecast(): void {
    if (!this.selectedCity || this.selectedCity.trim() === '') {
      this.error = 'Please select or enter a city.';
      this.forecastData = [];
      this.groupedForecast = [];
      this.resetCurrentWeatherDisplay();
      return;
    }
    this.error = '';
    this.loading = true;
    this.forecastData = [];
    this.groupedForecast = [];
    this.resetCurrentWeatherDisplay();

    this.weatherService.getForecast(this.selectedCity).subscribe({
      next: (data: HourlyWeatherEntry[]) => {
        this.forecastData = data;
        this.groupByDay(data);

        if (this.groupedForecast.length > 0) {
          this.selectedDayIndex = 0;
          this.selectedDayHours = this.groupedForecast[0].hours;
          this.updateCurrentWeatherDisplay();
        } else {
          this.selectedDayIndex = null;
          this.selectedDayHours = [];
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to fetch weather data. Please try again later.';
        this.loading = false;
        this.resetCurrentWeatherDisplay();
      }
    });
  }

  groupByDay(hourlyData: HourlyWeatherEntry[]): void {
    const map = new Map<string, HourlyWeatherEntry[]>();
    hourlyData.forEach(entry => {
      const day = entry.date.slice(0, 10);
      if (!map.has(day)) {
        map.set(day, []);
      }
      map.get(day)!.push(entry);
    });
    this.groupedForecast = Array.from(map, ([date, hours]) => ({ date, hours }));
  }

  toggleDay(index: number): void {
    if (this.selectedDayIndex === index) {
      this.selectedDayIndex = null;
      this.selectedDayHours = [];
    } else {
      this.selectedDayIndex = index;
      this.selectedDayHours = this.groupedForecast[index]?.hours || [];
    }
  }

  getMinTemp(hours: HourlyWeatherEntry[]): number {
    return Math.round(Math.min(...hours.map(h => h.minTemp)));
  }

  getMaxTemp(hours: HourlyWeatherEntry[]): number {
    return Math.round(Math.max(...hours.map(h => h.maxTemp)));
  }

  updateCurrentWeatherDisplay() {
    this.currentCity = this.selectedCity;
    if (this.groupedForecast.length > 0) {
      const todayHours = this.groupedForecast[0].hours;
      if (todayHours.length > 0) {
        this.currentTemp = Math.round(todayHours[0].maxTemp);
        this.todayMaxTemp = this.getMaxTemp(todayHours);
        this.todayMinTemp = this.getMinTemp(todayHours);
      } else {
        this.resetCurrentWeatherDisplay();
      }
    } else {
      this.resetCurrentWeatherDisplay();
    }
  }

  resetCurrentWeatherDisplay() {
    this.currentTemp = null;
    this.todayMaxTemp = null;
    this.todayMinTemp = null;
    this.currentCity = '';
  }

  getPolylinePoints(hours: HourlyWeatherEntry[]): string {
    if (!hours || hours.length === 0) return '';

    const WIDTH = 700;
    const HEIGHT = 130;
    const minTemp = 26;
    const maxTemp = 34;

    const stepX = WIDTH / (hours.length - 1);
    const yForTemp = (temp: number) =>
      HEIGHT - ((Math.round(temp) - minTemp) / (maxTemp - minTemp)) * HEIGHT;

    let points = '';
    hours.forEach((h, i) => {
      const x = i * stepX;
      const y = yForTemp(h.maxTemp);
      points += `${x},${y} `;
    });

    return points.trim();
  }
}
