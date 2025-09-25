import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { LandingPageComponent } from './landing/landing-page/landing-page.component';
import { authGuard } from './auth/auth.guard';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'landing', component: LandingPageComponent },
  {
    path: 'manual-input',
    loadComponent: () => import('./manual-input/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'manual-input/create-outline',
    loadComponent: () => import('./manual-input/create-outline/create-outline.component').then(m => m.CreateOutlineComponent),
  },
  {
    path: 'manual-input/create-storyboard',
    loadComponent: () => import('./manual-input/create-storyboard/create-storyboard.component').then(m => m.CreateStoryboardComponent),
  },
  {
    path: 'manual-input/view',
    loadComponent: () => import('./manual-input/view/view.component').then(m => m.ViewComponent),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
