import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../usuario.service';

@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './busqueda.component.html',
  styleUrls: ['./busqueda.component.css']
})
export class BusquedaComponent implements OnInit {
  @Output() resultados = new EventEmitter<any[]>();

  nombre: string = '';
  especializacion: string = '';
  precioMin: string = '';
  precioMax: string = '';
  ordenar: string = 'relevancia';
  mostrarFiltros: boolean = false;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    const filtro = {
      nombre: this.nombre,
      especializacion: this.especializacion,
      precioMin: this.precioMin,
      precioMax: this.precioMax,
      ordenar: this.ordenar
    };

    this.usuarioService.buscarUsuarios(filtro).subscribe({
      next: (usuarios: any[]) => {
        this.resultados.emit(usuarios);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error en búsqueda:', err);
      }
    });
  }

  limpiarFiltros(): void {
    this.nombre = '';
    this.especializacion = '';
    this.precioMin = '';
    this.ordenar = 'relevancia';
    this.buscar();
  }
}