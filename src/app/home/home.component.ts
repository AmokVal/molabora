import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../usuario.service';
import { BusquedaComponent } from '../busqueda/busqueda.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, BusquedaComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  listaUsuarios: any[] = [];
  estadoMensaje: string = 'Buscando perfiles registrados...';
  currentUser: any = null;
  selectedChatUser: any = null;
  chatMessages: any[] = [];
  chatText = '';
  fotoSeleccionada: File | null = null;
  previewFoto: string | null = null;
  errorMensaje: string = '';
  modoEdicion: boolean = false;
  userEditTemporal: any = null;

  // Contratos
  misContratos: any[] = [];
  mostrarContratos: boolean = false;
  contratoFiltro: string = 'todos';
  // Modal nuevo contrato
  modalContrato: boolean = false;
  profesionalParaContrato: any = null;
  descripcionContrato: string = '';
  contratoMensaje: string = '';
  contratoError: string = '';
  // Perfil expandido
  perfilExpandido: any = null;
  // Email verificación
  reenvioMensaje: string = '';
  reenvioError: string = '';
  reenvioEnviado: boolean = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit called');
    this.errorMensaje = '';
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('Token en localStorage:', token ? 'Presente' : 'NO EXISTE');
    
    this.usuarioService.obtenerPerfil().subscribe({
      next: (perfil) => {
        console.log('Perfil recibido:', perfil);
        this.currentUser = perfil;

        this.usuarioService.obtenerUsuarios().subscribe({
          next: (datosRecibidos) => {
            console.log('Usuarios recibidos:', datosRecibidos);
            this.listaUsuarios = datosRecibidos.filter((user: any) => user.id !== perfil.id);
            if (this.listaUsuarios.length === 0) {
              this.estadoMensaje = 'No hay usuarios disponibles en este momento.';
            } else {
              this.estadoMensaje = '';
            }
            console.log('Lista de usuarios filtrada:', this.listaUsuarios.length);
          },
          error: (err) => {
            console.error('Error obteniendo usuarios:', err);
            this.errorMensaje = 'Error al cargar usuarios: ' + (err.error?.error || err.message);
            this.estadoMensaje = 'No se pudo cargar la lista de usuarios.';
          }
        });
      },
      error: (err) => {
        console.error('Error obteniendo perfil:', err);
        this.errorMensaje = 'Error al cargar perfil: ' + (err.error?.error || err.message);
        this.estadoMensaje = 'No se pudo cargar el perfil actual.';
      }
    });
  }

  onFotoSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máximo 2MB)
      if (file.size > 2000000) {
        alert('La foto es demasiado grande. Máximo 2MB.');
        return;
      }
      this.fotoSeleccionada = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewFoto = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    const perfilActualizado = {
      studies: this.currentUser.studies || '',
      experience: this.currentUser.experience || '',
      schedule: this.currentUser.schedule || '',
      rates: this.currentUser.rates || '',
      bio: this.currentUser.bio || ''
    };

    // Solo enviar foto si se cambió y no es demasiado grande
    if (this.previewFoto && this.previewFoto.length < 2000000) {
      (perfilActualizado as any).photo = this.previewFoto;
    }

    this.usuarioService.actualizarPerfil(perfilActualizado).subscribe({
      next: (perfil) => {
        this.currentUser = perfil;
        this.modoEdicion = false;
        this.fotoSeleccionada = null;
        this.previewFoto = null;
        alert('Perfil actualizado correctamente');
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        alert('Error al actualizar el perfil. Intenta nuevamente.');
      }
    });
  }

  entrarEnEdicion() {
    this.modoEdicion = true;
    this.userEditTemporal = JSON.parse(JSON.stringify(this.currentUser));
    this.previewFoto = null;
    this.cdr.detectChanges();
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    if (this.userEditTemporal) {
      this.currentUser = this.userEditTemporal;
    }
    this.fotoSeleccionada = null;
    this.previewFoto = null;
    this.userEditTemporal = null;
    this.cdr.detectChanges();
  }

  openChat(user: any) {
    this.selectedChatUser = user;
    this.chatText = '';
    this.cdr.detectChanges();
    this.loadChat(user.id);
  }

  loadChat(otherUserId: number) {
    this.usuarioService.obtenerChat(otherUserId).subscribe({
      next: (messages) => {
        this.chatMessages = messages;
        this.cdr.detectChanges();
      },
      error: () => {
        this.chatMessages = [];
        this.cdr.detectChanges();
        alert('No se pudieron cargar los mensajes.');
      }
    });
  }

  sendMessage() {
    const text = this.chatText.trim();
    if (!text || !this.selectedChatUser) {
      return;
    }

    this.usuarioService.enviarMensaje(this.selectedChatUser.id, text).subscribe({
      next: (mensaje) => {
        this.chatMessages.push(mensaje);
        this.chatText = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
        alert('No se pudo enviar el mensaje.');
      }
    });
  }

  onBusquedaResultados(usuarios: any[]): void {
    console.log('Resultados de búsqueda recibidos:', usuarios.length, 'usuarios');
    this.listaUsuarios = usuarios.filter((user: any) => user.id !== this.currentUser?.id);
    console.log('Lista actualizada:', this.listaUsuarios.length, 'usuarios después de filtrar');
    if (this.listaUsuarios.length === 0) {
      this.estadoMensaje = 'No se encontraron usuarios que cumplan los criterios.';
    } else {
      this.estadoMensaje = '';
    }
  }

  logout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      sessionStorage.clear();
      this.usuarioService.logout();
      this.router.navigate(['/login']);
    }
  }

  irAModeracion(): void {
    if (this.currentUser?.role === 'administrador') {
      this.router.navigate(['/moderacion']);
    }
  }

  irAPremium(): void {
    this.router.navigate(['/premium']);
  }

  // ── CONTRATOS ──
  cargarMisContratos(): void {
    this.usuarioService.obtenerMisContratos().subscribe({
      next: (contratos: any[]) => {
        this.misContratos = contratos;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando contratos:', err);
      }
    });
  }

  toggleContratos(): void {
    this.mostrarContratos = !this.mostrarContratos;
    if (this.mostrarContratos && this.misContratos.length === 0) {
      this.cargarMisContratos();
    }
  }

  get contratosFiltrados(): any[] {
    if (this.contratoFiltro === 'todos') return this.misContratos;
    return this.misContratos.filter(c => c.status === this.contratoFiltro);
  }

  abrirModalContrato(profesional: any): void {
    // Verificación de email deshabilitada temporalmente
    // if (!this.currentUser?.email_verified) {
    //   alert('⚠️ Debes verificar tu email antes de crear contratos.');
    //   return;
    // }
    this.profesionalParaContrato = profesional;
    this.descripcionContrato = '';
    this.contratoError = '';
    this.contratoMensaje = '';
    this.modalContrato = true;
    this.cdr.detectChanges();
  }

  reenviarVerificacion(): void {
    this.reenvioMensaje = '';
    this.reenvioError = '';
    this.usuarioService.reenviarVerificacion().subscribe({
      next: () => {
        this.reenvioMensaje = '✓ Email enviado. Revisa tu bandeja de entrada.';
        this.reenvioEnviado = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.reenvioError = err.error?.error || 'Error al reenviar el email';
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalContrato(): void {
    this.modalContrato = false;
    this.profesionalParaContrato = null;
    this.cdr.detectChanges();
  }

  crearContrato(): void {
    if (!this.descripcionContrato.trim()) {
      this.contratoError = 'Por favor describe el trabajo a realizar';
      return;
    }
    this.usuarioService.crearContrato(this.profesionalParaContrato.id, this.descripcionContrato).subscribe({
      next: (contrato: any) => {
        this.contratoMensaje = '¡Contrato creado correctamente!';
        this.contratoError = '';
        this.misContratos.unshift(contrato);
        setTimeout(() => this.cerrarModalContrato(), 1500);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.contratoError = err.error?.error || 'Error al crear el contrato';
        this.cdr.detectChanges();
      }
    });
  }

  actualizarContrato(contrato: any, nuevoEstado: string): void {
    const confirmMsg = nuevoEstado === 'completed'
      ? '¿Marcar este contrato como completado?'
      : '¿Cancelar este contrato?';
    if (!confirm(confirmMsg)) return;

    this.usuarioService.actualizarEstadoContrato(contrato.id, nuevoEstado).subscribe({
      next: (updated: any) => {
        const idx = this.misContratos.findIndex(c => c.id === contrato.id);
        if (idx !== -1) this.misContratos[idx] = { ...this.misContratos[idx], ...updated };
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        alert(err.error?.error || 'Error al actualizar contrato');
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: any = { active: 'Activo', completed: 'Completado', cancelled: 'Cancelado' };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: any = { active: 'estado-activo', completed: 'estado-completado', cancelled: 'estado-cancelado' };
    return classes[status] || '';
  }

  esCliente(contrato: any): boolean {
    return contrato.client_id === this.currentUser?.id;
  }

  verPerfil(user: any): void {
    this.perfilExpandido = this.perfilExpandido?.id === user.id ? null : user;
    this.cdr.detectChanges();
  }
}