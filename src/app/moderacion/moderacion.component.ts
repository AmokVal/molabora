import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../usuario.service';

@Component({
  selector: 'app-moderacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './moderacion.component.html',
  styleUrls: ['./moderacion.component.css']
})
export class ModeracionComponent implements OnInit {
  usuarios: any[] = [];
  estadisticas: any = null;
  cargando: boolean = true;
  errorMensaje: string = '';
  successMensaje: string = '';
  
  usuarioSeleccionado: any = null;
  modalAbierto: boolean = false;
  accionModal: string = ''; // 'rol', 'banear', 'info'
  nuevoRol: string = 'normal';
  razonBaneo: string = '';

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarEstadisticas();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.obtenerTodosLosUsuarios().subscribe({
      next: (usuarios: any[]) => {
        this.usuarios = usuarios;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMensaje = 'Error al cargar usuarios: ' + (err.error?.error || err.message);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarEstadisticas(): void {
    this.usuarioService.obtenerEstadisticas().subscribe({
      next: (stats: any) => {
        this.estadisticas = stats;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando estadísticas:', err);
      }
    });
  }

  abrirModal(usuario: any, accion: string): void {
    this.usuarioSeleccionado = usuario;
    this.accionModal = accion;
    this.modalAbierto = true;
    this.razonBaneo = '';
    this.nuevoRol = usuario.role;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.usuarioSeleccionado = null;
    this.accionModal = '';
    this.cdr.detectChanges();
  }

  cambiarRol(): void {
    if (!this.usuarioSeleccionado || !this.nuevoRol) {
      return;
    }

    this.usuarioService.cambiarRolUsuario(this.usuarioSeleccionado.id, this.nuevoRol).subscribe({
      next: (result: any) => {
        this.successMensaje = 'Rol actualizado correctamente';
        setTimeout(() => this.successMensaje = '', 3000);
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (err: any) => {
        this.errorMensaje = err.error?.error || 'Error al cambiar rol';
        this.cdr.detectChanges();
      }
    });
  }

  banearUsuario(): void {
    if (!this.usuarioSeleccionado || !this.razonBaneo.trim()) {
      this.errorMensaje = 'Por favor, ingresa una razón para el baneo';
      return;
    }

    this.usuarioService.banearUsuario(this.usuarioSeleccionado.id, this.razonBaneo).subscribe({
      next: (result: any) => {
        this.successMensaje = 'Usuario baneado correctamente';
        setTimeout(() => this.successMensaje = '', 3000);
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (err: any) => {
        this.errorMensaje = err.error?.error || 'Error al banear usuario';
        this.cdr.detectChanges();
      }
    });
  }

  desbanearUsuario(usuario: any): void {
    if (!confirm('¿Estás seguro de que quieres desbanear a este usuario?')) {
      return;
    }

    this.usuarioService.desbanearUsuario(usuario.id).subscribe({
      next: (result: any) => {
        this.successMensaje = 'Usuario desbaneado correctamente';
        setTimeout(() => this.successMensaje = '', 3000);
        this.cargarUsuarios();
      },
      error: (err: any) => {
        this.errorMensaje = err.error?.error || 'Error al desbanear usuario';
        this.cdr.detectChanges();
      }
    });
  }

  verificarEmailManualmente(usuario: any): void {
    this.usuarioService.verificarEmailManualmente(usuario.id).subscribe({
      next: (result: any) => {
        this.successMensaje = 'Email verificado manualmente';
        setTimeout(() => this.successMensaje = '', 3000);
        this.cargarUsuarios();
      },
      error: (err: any) => {
        this.errorMensaje = err.error?.error || 'Error al verificar email';
        this.cdr.detectChanges();
      }
    });
  }
}