# Weather Dashboard UI

## Overview

This Angular application provides a user-friendly weather dashboard interface.  
Users can input cities to fetch weather data, view detailed forecasts in a clean layout, and toggle between online and offline modes.

The UI uses PrimeNG components and SVG graphics to display dynamic temperature curves and interactive tooltips.

---

## Features

- Responsive weather dashboard with current temperature, weather description, and min/max.
- City input with autocomplete from a predefined list.
- Offline mode toggle to switch between live API calls and cached/offline data.
- Interactive day-wise forecast selection.
- Dynamic temperature curve visualization with tooltip on hover.
- Error and loading state handling.

---

## Design and Implementation Approach

- **Component-Based Structure:**  
  Built with Angular components, using PrimeNG UI elements for a polished user experience.

- **Two-Way Binding and Event Handling:**  
  City input and offline toggle use `[(ngModel)]` for reactive updates. User actions trigger API calls.

- **Service Integration:**  
  Connects to backend weather service API, passing the offline toggle flag to control request mode.

- **SVG Graphics & Data Binding:**  
  Temperature curves are rendered using SVG `<polyline>`, updated dynamically with user selection.

- **User Feedback:**  
  Loading states disable inputs and display informative messages. Errors are clearly shown.

---

## Technologies Used

- Angular 15
- PrimeNG UI Library
- TypeScript, SCSS/CSS
- RxJS for asynchronous data flow
- SVG for custom charts and tooltips

---

## Design Patterns Used

- **Component Pattern:** Angular follows component-driven UI design for modularity.
- **Observer Pattern:** RxJS observables manage asynchronous service calls and UI updates.
- **Facade Pattern:** Services provide a simplified interface for components to access backend data.
- **Dependency Injection:** Angular’s DI handles service injection cleanly.
- **State Management:** Local component state controls UI toggles and selected forecast day.

---

## How to Run

1. Install dependencies: npm install
2. Run the development server: ng serve
3. Open in browser at `http://localhost:4200`

---

## Usage

- Use the city input to type or select a city.
- Toggle **Offline Mode** using the switch in the top right to simulate offline behavior.
- Click **Search** or press **Enter** to fetch weather forecast.
- Select a day from the weekly forecast to view detailed hourly temperatures.
- Hover over the temperature curve to view detailed tooltips.

---

*For detailed backend API info, see the backend README.*




