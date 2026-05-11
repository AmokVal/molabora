import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  planes: any[] = [];
  planSeleccionado: any = null;
  cargando: boolean = false;
  cargandoPlanes: boolean = true;
  mensaje: string = '';
  error: string = '';

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEstado();
    this.cargarPlanes();
    // Verificar si venimos de Stripe con pago exitoso
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      const planId = params['plan_id'];
      if (sessionId && planId) {
        this.verificarPago(sessionId, parseInt(planId));
      }
    });
  }

  cargarEstado(): void {
    this.usuarioService.obtenerEstadoPremium().subscribe({
      next: (usuario: any) => {
        this.usuario = usuario;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar estado premium';
      }
    });
  }

  cargarPlanes(): void {
    this.usuarioService.obtenerPlanes().subscribe({
      next: (planes: any[]) => {
        this.planes = planes;
        this.cargandoPlanes = false;
        if (planes.length > 0) {
          this.planSeleccionado = planes[0];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoPlanes = false;
        this.error = 'Error al cargar los planes de suscripción';
      }
    });
  }

  seleccionarPlan(plan: any): void {
    this.planSeleccionado = plan;
  }

  getPrecio(priceCents: number): string {
    return (priceCents / 100).toFixed(2);
  }

  iniciarPago(): void {
    if (!this.planSeleccionado) {
      this.error = 'Por favor selecciona un plan';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.usuarioService.crearSesionPago(this.planSeleccionado.id).subscribe({
      next: (result: any) => {
        // Redirigir a Stripe Checkout
        if (result.url) {
          window.location.href = result.url;
        } else {
          this.error = 'No se recibió URL de pago';
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.error = 'Error al crear sesión de pago: ' + (err.error?.error || err.message);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  verificarPago(sessionId: string, planId: number): void {
    this.cargando = true;
    this.mensaje = 'Verificando tu pago...';
    this.usuarioService.verificarPago(sessionId, planId).subscribe({
      next: (result: any) => {
        this.mensaje = result.message || '¡Felicidades! Ahora eres usuario Premium';
        this.cargando = false;
        // Actualizar localStorage con nuevo estado
        const storedUser = localStorage.getItem('usuario');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.isPremium = true;
          localStorage.setItem('usuario', JSON.stringify(user));
        }
        this.cargarEstado();
        // Limpiar query params
        this.router.navigate(['/premium'], { replaceUrl: true });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err.error?.error || 'Error al verificar pago';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/home']);
  }
}