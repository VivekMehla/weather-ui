import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Forecast } from './forecast';
import { WeatherService } from '../service/weather';
import { of, throwError } from 'rxjs';
import { HourlyWeatherEntry } from '../models/hourly-weather-entry.model';

class MockWeatherService {
  getForecast = jasmine.createSpy('getForecast');
}

describe('Forecast', () => {
  let component: Forecast;
  let fixture: ComponentFixture<Forecast>;
  let weatherService: MockWeatherService;

  const mockHourlyWeather: HourlyWeatherEntry[] = [
    {
      date: '2025-09-10 03:00:00',
      minTemp: 10,
      maxTemp: 15,
      maxWind: 5,
      rain: false,
      thunderstorm: false,
      prediction: 'Clear sky'
    },
    {
      date: '2025-09-10 06:00:00',
      minTemp: 12,
      maxTemp: 16,
      maxWind: 4,
      rain: false,
      thunderstorm: false,
      prediction: 'Sunny'
    }
  ];

  beforeEach(async () => {
    weatherService = new MockWeatherService();

    await TestBed.configureTestingModule({
      imports: [Forecast],
      providers: [
        { provide: WeatherService, useValue: weatherService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Forecast);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty data and default values', () => {
    expect(component.groupedForecast).toEqual([]);
    expect(component.selectedDayIndex).toBeNull();
    expect(component.currentTemp).toBeNull();
    expect(component.currentPrediction).toBe('');
  });

  describe('groupByDay()', () => {
    it('should group hourly entries by date correctly', () => {
      const hourlyData = [
        { date: '2025-09-10 01:00:00', minTemp: 0, maxTemp: 1, maxWind: 1, rain: false, thunderstorm: false, prediction: '' },
        { date: '2025-09-10 02:00:00', minTemp: 1, maxTemp: 2, maxWind: 1, rain: false, thunderstorm: false, prediction: '' },
        { date: '2025-09-11 01:00:00', minTemp: 3, maxTemp: 4, maxWind: 1, rain: false, thunderstorm: false, prediction: '' }
      ] as HourlyWeatherEntry[];

      component.groupByDay(hourlyData);

      expect(component.groupedForecast.length).toBe(2);
      expect(component.groupedForecast[0].date).toBe('2025-09-10');
      expect(component.groupedForecast[0].hours.length).toBe(2);
      expect(component.groupedForecast[1].date).toBe('2025-09-11');
      expect(component.groupedForecast[1].hours.length).toBe(1);
    });
  });

  describe('toggleDay()', () => {
    beforeEach(() => {
      component.groupedForecast = [
        { date: '2025-09-10', hours: mockHourlyWeather },
        { date: '2025-09-11', hours: [] }
      ];
      component.selectedDayIndex = null;
      component.selectedDayHours = [];
    });

    it('should select a day and update hours', () => {
      component.toggleDay(0);

      expect(component.selectedDayIndex).toBe(0);
      expect(component.selectedDayHours).toBe(component.groupedForecast[0].hours);
    });

    it('should deselect current day if toggled again', () => {
      component.toggleDay(0);
      component.toggleDay(0);

      expect(component.selectedDayIndex).toBeNull();
      expect(component.selectedDayHours).toEqual([]);
    });

    it('should switch selection when different day clicked', () => {
      component.toggleDay(0);
      component.toggleDay(1);

      expect(component.selectedDayIndex).toBe(1);
      expect(component.selectedDayHours).toBe(component.groupedForecast[1].hours);
    });
  });

  describe('updateCurrentWeatherDisplay()', () => {
    it('should update current weather info based on selected day', () => {
      component.selectedCity = 'Test City';
      component.selectedDayHours = mockHourlyWeather;

      component.updateCurrentWeatherDisplay();

      expect(component.currentCity).toBe('Test City');
      expect(component.currentTemp).toBe(Math.round(mockHourlyWeather[0].maxTemp));
      expect(component.todayMaxTemp).toBe(component.getMaxTemp(mockHourlyWeather));
      expect(component.todayMinTemp).toBe(component.getMinTemp(mockHourlyWeather));
      expect(component.currentPrediction).toBe(mockHourlyWeather[0].prediction);
    });

    it('should reset display if no selected day hours', () => {
      component.selectedCity = 'City X';
      component.selectedDayHours = [];

      component.updateCurrentWeatherDisplay();

      expect(component.currentTemp).toBeNull();
      expect(component.todayMaxTemp).toBeNull();
      expect(component.todayMinTemp).toBeNull();
      expect(component.currentPrediction).toBe('');
    });
  });

  describe('fetchForecast()', () => {
    it('should early return and set error on empty city', () => {
      component.selectedCity = '  ';
      component.fetchForecast();

      expect(component.error).toBe('Please select or enter a city.');
      expect(component.loading).toBeFalse();
    });

    it('should call WeatherService.getForecast and update on success', fakeAsync(() => {
      component.selectedCity = 'City A';
      weatherService.getForecast.and.returnValue(of(mockHourlyWeather));

      component.fetchForecast();
      tick();

      expect(weatherService.getForecast).toHaveBeenCalledOnceWith('City A');
      expect(component.forecastData).toEqual(mockHourlyWeather);
      expect(component.groupedForecast.length).toBeGreaterThan(0);
      expect(component.loading).toBeFalse();
    }));

    it('should handle error from WeatherService.getForecast', fakeAsync(() => {
      const errorResponse = { message: 'Error' };
      weatherService.getForecast.and.returnValue(throwError(() => errorResponse));

      component.selectedCity = 'City B';
      component.fetchForecast();
      tick();

      expect(component.error).toBe('Failed to fetch weather data. Please try again later.');
      expect(component.loading).toBeFalse();
      expect(component.currentTemp).toBeNull();
    }));
  });

  describe('getPolylinePoints()', () => {
    it('should return empty string if no hours', () => {
      const result = component.getPolylinePoints([]);
      expect(result).toBe('');
    });

    it('should return correct points string', () => {
      const hours = [
        { maxTemp: 20, minTemp: 18, date: '', maxWind: 0, rain: false, thunderstorm: false, prediction: '' },
        { maxTemp: 30, minTemp: 25, date: '', maxWind: 0, rain: false, thunderstorm: false, prediction: '' },
        { maxTemp: 40, minTemp: 35, date: '', maxWind: 0, rain: false, thunderstorm: false, prediction: '' }
      ] as HourlyWeatherEntry[];

      component.yAxisMin = 15;
      component.yAxisMax = 45;

      const points = component.getPolylinePoints(hours, 200);
      expect(points).toContain('0,130');
      expect(points).toContain('100,65');
      expect(points).toContain('200,0');
    });
  });

  describe('updateYAxisBounds()', () => {
    it('should update yAxisMin/yAxisMax with padding', () => {
      const hours = [
        { minTemp: 10, maxTemp: 20, date: '', maxWind: 0, rain: false, thunderstorm: false, prediction: '' },
        { minTemp: 15, maxTemp: 25, date: '', maxWind: 0, rain: false, thunderstorm: false, prediction: '' }
      ] as HourlyWeatherEntry[];

      component.updateYAxisBounds(hours);
      expect(component.yAxisMin).toBeLessThanOrEqual(10);
      expect(component.yAxisMax).toBeGreaterThanOrEqual(25);
      expect(component.yAxisMax - component.yAxisMin).toBeGreaterThanOrEqual(5);
    });

    it('should reset to default when hours empty', () => {
      component.updateYAxisBounds([]);
      expect(component.yAxisMin).toBe(20);
      expect(component.yAxisMax).toBe(40);
    });
  });

  describe('Tooltip interaction (onMouseMove/onMouseLeave)', () => {
    beforeEach(() => {
      component.selectedDayHours = mockHourlyWeather;
      component.yAxisMin = 5;
      component.yAxisMax = 20;
    });

    it('should show tooltip and update on mouse move', () => {
      const fakeEvent = {
        target: {
          ownerSVGElement: {
            createSVGPoint: () => ({
              x: 0,
              y: 0,
              matrixTransform: () => ({ x: 50, y: 50 })
            })
          }
        },
        clientX: 0,
        clientY: 0
      } as unknown as MouseEvent;

      component.onMouseMove(fakeEvent);
      expect(component.tooltipVisible).toBeTrue();
      expect(component.tooltipTime).toBeDefined();
      expect(component.tooltipTemp).toBeDefined();
    });

    it('should hide tooltip on mouse leave', () => {
      component.tooltipVisible = true;
      component.onMouseLeave();
      expect(component.tooltipVisible).toBeFalse();
    });
  });
});
