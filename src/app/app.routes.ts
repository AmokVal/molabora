import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { RegistroComponent } from './registro/registro';
import { ListadoComponent } from './listado/listado';
import { Principal } from './principal/principal';



export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: "listado", component: ListadoComponent},
  
  // Redirigir a registro
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: 'principal', component: Principal},
   
];