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

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  entrar() {
    this.usuarioService.login(this.credenciales).subscribe({
      next: (respuesta: any) => {
        alert('Login correcto');
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        alert('Error en las credenciales');
        console.error(error);
      }
    });
  }}