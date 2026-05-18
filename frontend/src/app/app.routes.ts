// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Ruta por defecto: redirige según autenticación
  {
    path: '',
    redirectTo: 'team',
    pathMatch: 'full'
  },

  // Rutas públicas (sin autenticación)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },

  // Rutas protegidas (requieren autenticación)
  {
    path: 'team',
    loadComponent: () => import('./features/team-builder/team-board/team-board.component').then(m => m.TeamBoardComponent),
    canActivate: [authGuard]
  },

  // Ruta 404 (no encontrada)
  {
    path: '**',
    redirectTo: 'team'
  }
];