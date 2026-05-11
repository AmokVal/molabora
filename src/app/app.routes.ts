import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';
import { HomeComponent } from './home/home.component';
import { PremiumComponent } from './premium/premium.component';
import { ModeracionComponent } from './moderacion/moderacion.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';

// Guard: requiere login
const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

// Guard: requiere rol administrador
const adminGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'administrador') {
      router.navigate(['/home']);
      return false;
    }
    return true;
  } catch {
    router.navigate(['/login']);
    return false;
  }
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: 'premium', component: PremiumComponent, canActivate: [authGuard] },
  { path: 'moderacion', component: ModeracionComponent, canActivate: [adminGuard] },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];