import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../usuario.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credenciales = {
    email: '',
    password: ''
  };

  cargando = false;
  mensaje = '';

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  entrar() {
    if (!this.credenciales.email || !this.credenciales.password) {
      alert('Por favor completa todos los campos');
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.usuarioService.login(this.credenciales).subscribe({
      next: (respuesta: any) => {
        console.log('✓ Login exitoso');
        localStorage.setItem('token', respuesta.token);
        localStorage.setItem('usuario', JSON.stringify(respuesta.user));
        
        // Redirigir a /home
        this.router.navigate(['/home']);
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('❌ Error en login:', error);
        this.cargando = false;
        this.mensaje = error.error?.error || 'Error al iniciar sesión. Intenta nuevamente.';
        alert(this.mensaje);
      }
    });
  }

  irAlRegistro() {
    this.router.navigate(['/registro']);
  }
}

