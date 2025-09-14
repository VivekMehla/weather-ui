import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { WeatherEntry } from '../models/weather-entry.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private readonly baseUrl: string = environment.weatherApiBaseUrl || 'http://localhost:8082/weather-service/forecast';
  private readonly REQUEST_TIMEOUT_MS = 10000; // 10 seconds timeout

  constructor(private http: HttpClient) {}

  /**
   * Fetch weather forecast for the specified city.
   * @param city City name to query
   * @returns Observable of WeatherEntry array
   */
  getForecast(city: string, isOffline: boolean): Observable<WeatherEntry[]> {
    const params = new HttpParams().set('city', city.trim()).set('offline', String(isOffline));

    return this.http.get<WeatherEntry[]>("http://localhost:8082/weather-service/forecast", { params }).pipe(
      timeout(this.REQUEST_TIMEOUT_MS),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse | TimeoutError): Observable<never> {
    if (error instanceof TimeoutError) {
      console.error(`Request timed out after ${this.REQUEST_TIMEOUT_MS} ms`);
      return throwError(() => new Error('Request timed out. Please try again.'));
    }

    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        console.error('Network error:', error.error.message);
        return throwError(() => new Error('Network error occurred. Please check your connection.'));
      } else {
        // Backend returned an unsuccessful response code.
        console.error(`Backend error (${error.status}):`, error.error);
        return throwError(() => new Error(`Service error (code ${error.status}). Please try later.`));
      }
    }

    // For any other unknown error types
    console.error('An unknown error occurred:', error);
    return throwError(() => new Error('An unexpected error occurred. Please try again.'));
  }
}
