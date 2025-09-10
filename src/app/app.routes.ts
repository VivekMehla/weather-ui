import { Routes } from '@angular/router';

import { Forecast } from './forecast/forecast';

export const routes: Routes = [
  { path: '', redirectTo: 'forecast', pathMatch: 'full' },
  { path: 'forecast', component: Forecast }
];
