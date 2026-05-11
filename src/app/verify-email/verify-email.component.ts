import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  estado: 'cargando' | 'exito' | 'error' = 'cargando';
  mensaje: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado = 'error';
      this.mensaje = 'Token de verificación no encontrado.';
      return;
    }

    this.http.get<any>(`http://localhost:3000/api/auth/verify-email?token=${token}`).subscribe({
      next: (res) => {
        this.estado = 'exito';
        this.mensaje = res.message || '¡Email verificado correctamente!';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.estado = 'error';
        this.mensaje = err.error?.error || 'Error al verificar el email.';
      }
    });
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}