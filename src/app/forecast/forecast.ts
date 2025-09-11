import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { WeatherService } from '../service/weather';
import { HourlyWeatherEntry } from '../models/hourly-weather-entry.model';
import { GroupedDayForecast } from '../models/grouped-day-forecast.model';

@Component({
  selector: 'app-forecast',
  templateUrl: './forecast.html',
  styleUrls: ['./forecast.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule]
})
export class Forecast implements OnInit {
  loading = false;
  error = '';
  cities: string[] = ['City A', 'City B', 'City C'];
  selectedCity: string = this.cities.length > 0 ? this.cities[0] : '';
  forecastData: HourlyWeatherEntry[] = [];

  groupedForecast: GroupedDayForecast[] = [];
  selectedDayIndex: number | null = null;
  selectedDayHours: HourlyWeatherEntry[] = [];

  currentTemp: number | null = null;
  currentCity: string = '';
  todayMaxTemp: number | null = null;
  todayMinTemp: number | null = null;
  currentPrediction: string = '';
  currentDateTimeString: string = '';

  readonly CURVE_WIDTH: number = 805;
  readonly CURVE_HEIGHT: number = 130;

  // dynamic Y-axis boundaries
  yAxisMin: number = 20;
  yAxisMax: number = 40;

  // Tooltip state
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipTime = '';
  tooltipTemp: number | null = null;

  constructor(private weatherService: WeatherService) {}

  ngOnInit(): void {
    this.groupByDay(this.forecastData);
    this.setInitialSelectedDay();
    this.updateCurrentDateTime();
    setInterval(() => this.updateCurrentDateTime(), 60000);
  }

  private setInitialSelectedDay(): void {
    if (this.groupedForecast.length > 0) {
      this.selectedDayIndex = 0;
      this.selectedDayHours = this.groupedForecast[0].hours;
      this.updateYAxisBounds(this.selectedDayHours);
      this.updateCurrentWeatherDisplay();
    } else {
      this.selectedDayIndex = null;
      this.selectedDayHours = [];
      this.resetCurrentWeatherDisplay();
    }
  }

  private updateCurrentDateTime(): void {
    const now = new Date();
    const day = now.toLocaleDateString(undefined, { weekday: 'long' });
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.currentDateTimeString = `${day} ${time}`;
  }

  fetchForecast(): void {
    const city = this.selectedCity.trim();
    if (!city) {
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

    this.weatherService.getForecast(city).subscribe({
      next: (data: HourlyWeatherEntry[]) => {
        this.forecastData = Array.isArray(data) ? data : [];
        this.groupByDay(this.forecastData);
        this.setInitialSelectedDay();
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
      const parsedDate = this.parseDateToKey(entry.date);
      if (!map.has(parsedDate)) {
        map.set(parsedDate, []);
      }
      map.get(parsedDate)!.push(entry);
    });
    this.groupedForecast = Array.from(map, ([date, hours]) => ({ date, hours }));
  }

  private parseDateToKey(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    return dateStr.slice(0, 10);
  }

  toggleDay(index: number): void {
    if (index === this.selectedDayIndex) {
      this.selectedDayIndex = null;
      this.selectedDayHours = [];
      this.resetCurrentWeatherDisplay();
      this.tooltipVisible = false;
    } else {
      this.selectedDayIndex = index;
      this.selectedDayHours = this.groupedForecast[index]?.hours ?? [];
      this.updateYAxisBounds(this.selectedDayHours);
      this.updateCurrentWeatherDisplay();
      this.tooltipVisible = false;
    }
  }

  getMinTemp(hours: HourlyWeatherEntry[]): number {
    if (!hours || hours.length === 0) return 0;
    return Math.round(Math.min(...hours.map(h => h.minTemp)));
  }

  getMaxTemp(hours: HourlyWeatherEntry[]): number {
    if (!hours || hours.length === 0) return 0;
    return Math.round(Math.max(...hours.map(h => h.maxTemp)));
  }

  updateCurrentWeatherDisplay(): void {
    this.currentCity = this.selectedCity;
    if (this.selectedDayHours.length === 0) {
      this.resetCurrentWeatherDisplay();
      return;
    }
    this.currentTemp = Math.round(this.selectedDayHours[0].maxTemp);
    this.todayMaxTemp = this.getMaxTemp(this.selectedDayHours);
    this.todayMinTemp = this.getMinTemp(this.selectedDayHours);
    this.currentPrediction = this.selectedDayHours[0].prediction || '';
  }

  resetCurrentWeatherDisplay(): void {
    this.currentTemp = null;
    this.todayMaxTemp = null;
    this.todayMinTemp = null;
    this.currentCity = '';
    this.currentPrediction = '';
  }

  updateYAxisBounds(hours: HourlyWeatherEntry[]): void {
    if (!hours || hours.length === 0) {
      this.yAxisMin = 20;
      this.yAxisMax = 40;
      return;
    }
    const minTemp = Math.min(...hours.map(h => h.minTemp));
    const maxTemp = Math.max(...hours.map(h => h.maxTemp));
    const padding = 2;
    this.yAxisMin = Math.floor(minTemp - padding);
    this.yAxisMax = Math.ceil(maxTemp + padding);
    if (this.yAxisMax <= this.yAxisMin) {
      this.yAxisMax = this.yAxisMin + 5;
    }
  }

  getPolylinePoints(hours: HourlyWeatherEntry[], width: number = this.CURVE_WIDTH): string {
    if (!hours || hours.length === 0) return '';

    const HEIGHT = this.CURVE_HEIGHT;
    const minTemp = this.yAxisMin;
    const maxTemp = this.yAxisMax;
    const stepX = width / Math.max(1, hours.length - 1);

    const yForTemp = (temp: number): number =>
      HEIGHT - ((Math.round(temp) - minTemp) / (maxTemp - minTemp)) * HEIGHT;

    return hours.map((h, i) => `${i * stepX},${yForTemp(h.maxTemp)}`).join(' ');
  }

  getYAxisLabels(): number[] {
    const labelsCount = 5;
    const labels: number[] = [];
    if (this.yAxisMax <= this.yAxisMin) {
      for (let i = 0; i < labelsCount; i++) {
        labels.push(this.yAxisMin + i);
      }
    } else {
      const step = (this.yAxisMax - this.yAxisMin) / (labelsCount - 1);
      for (let i = 0; i < labelsCount; i++) {
        labels.push(Math.round(this.yAxisMin + step * i));
      }
    }
    return labels.reverse();
  }

  // Tooltip handlers
  onMouseMove(event: MouseEvent): void {
    if (!this.selectedDayHours || this.selectedDayHours.length === 0) {
      this.tooltipVisible = false;
      return;
    }

    const svg = (event.target as SVGElement).ownerSVGElement!;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const cursorpt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const x = cursorpt.x - 45; // adjust for translate(45,0)
    if (x < 0) {
      this.tooltipVisible = false;
      return;
    }

    const stepX = this.CURVE_WIDTH / (this.selectedDayHours.length - 1);
    const index = Math.round(x / stepX);
    if (index < 0 || index >= this.selectedDayHours.length) {
      this.tooltipVisible = false;
      return;
    }

    const entry = this.selectedDayHours[index];
    const date = new Date(entry.date);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.tooltipTime = timeStr;
    this.tooltipTemp = Math.round(entry.maxTemp);
    this.tooltipX = cursorpt.x;
    this.tooltipY = cursorpt.y;
    this.tooltipVisible = true;
  }

  onMouseLeave(): void {
    this.tooltipVisible = false;
  }
}
