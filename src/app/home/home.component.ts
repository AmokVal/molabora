import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../usuario.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  listaUsuarios: any[] = [];
  estadoMensaje: string = 'Buscando perfiles registrados...';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (datosRecibidos) => {
        // Guardamos los datos recibidos
        this.listaUsuarios = datosRecibidos;
      },
      error: (fallo) => {
        this.estadoMensaje = 'No se pudo cargar la lista.';
      }
    });
  }
}