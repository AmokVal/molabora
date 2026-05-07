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
        this.cdr.detectChanges();
        this.estadoMensaje = 'Cargando usuarios disponibles...';

        this.usuarioService.obtenerUsuarios().subscribe({
          next: (datosRecibidos) => {
            console.log('Usuarios recibidos:', datosRecibidos);
            this.listaUsuarios = datosRecibidos.filter((user: any) => user.id !== perfil.id);
            this.cdr.detectChanges();
            if (this.listaUsuarios.length === 0) {
              this.estadoMensaje = 'No hay usuarios disponibles en este momento.';
            }
            console.log('Lista de usuarios filtrada:', this.listaUsuarios.length);
          },
          error: (err) => {
            console.error('Error obteniendo usuarios:', err);
            this.errorMensaje = 'Error al cargar usuarios: ' + (err.error?.error || err.message);
            this.estadoMensaje = 'No se pudo cargar la lista de usuarios.';
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error obteniendo perfil:', err);
        this.errorMensaje = 'Error al cargar perfil: ' + (err.error?.error || err.message);
        this.estadoMensaje = 'No se pudo cargar el perfil actual.';
        this.cdr.detectChanges();
      }
    });
  }

  onFotoSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fotoSeleccionada = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewFoto = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    const perfilActualizado = {
      studies: this.currentUser.studies,
      experience: this.currentUser.experience,
      schedule: this.currentUser.schedule,
      tarifa_por_hora: this.currentUser.tarifa_por_hora || 0,
      tarifa_minima: this.currentUser.tarifa_minima || 0,
      bio: this.currentUser.bio || ''
    };

    if (this.previewFoto) {
      (perfilActualizado as any).photo = this.previewFoto;
    }

    this.usuarioService.actualizarPerfil(perfilActualizado).subscribe({
      next: (perfil) => {
        this.currentUser = perfil;
        this.modoEdicion = false;
        this.fotoSeleccionada = null;
        this.previewFoto = null;
        this.cdr.detectChanges();
        alert('Perfil actualizado correctamente');
      },
      error: () => {
        this.cdr.detectChanges();
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
    this.listaUsuarios = usuarios.filter((user: any) => user.id !== this.currentUser?.id);
    this.cdr.detectChanges();
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

  verificarEmail(): void {
    this.usuarioService.verificarEmailManual().subscribe({
      next: (response) => {
        this.currentUser.email_verified = true;
        alert('Email verificado correctamente');
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error al verificar email');
      }
    });
  }
}