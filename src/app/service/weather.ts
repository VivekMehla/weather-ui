import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeatherEntry {
  date: string;
  minTemp: number;
  maxTemp: number;
  maxWind: number;
  rain: boolean;
  thunderstorm: boolean;
  prediction: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private baseUrl = 'http://localhost:8080/weather-service/forecast';

  constructor(private http: HttpClient) { }

  getForecast(city: string): Observable<WeatherEntry[]> {
    const url = `${this.baseUrl}?city=${encodeURIComponent(city.trim())}`;
    return this.http.get<WeatherEntry[]>(url);
  }
}
