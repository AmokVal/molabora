import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../usuario.service';

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './premium.component.html',
  styleUrls: ['./premium.component.css']
})
export class PremiumComponent implements OnInit {
  usuario: any = null;
  cargando: boolean = false;
  mensaje: string = '';
  error: string = '';

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEstado();
  }

  cargarEstado(): void {
    this.usuarioService.obtenerEstadoPremium().subscribe({
      next: (usuario: any) => {
        this.usuario = usuario;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Error al cargar estado premium';
      }
    });
  }

  iniciarPago(): void {
    this.cargando = true;
    this.usuarioService.crearSesionPago().subscribe({
      next: (result: any) => {
        // Aquí irías a Stripe (en producción)
        this.mensaje = 'En una aplicación real, esto te llevaría a Stripe. Por ahora, simularemos la compra.';
        setTimeout(() => {
          this.verificarPago(result.sessionId);
        }, 2000);
      },
      error: (err: any) => {
        this.error = 'Error al crear sesión de pago: ' + err.error?.error;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  verificarPago(sessionId: string): void {
    this.usuarioService.verificarPago(sessionId).subscribe({
      next: (result: any) => {
        this.mensaje = '¡Felicidades! Ahora eres usuario premium';
        this.cargando = false;
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err.error?.error || 'Error al verificar pago';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}