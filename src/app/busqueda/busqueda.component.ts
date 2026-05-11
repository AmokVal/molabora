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
  presupuestoMin: string = '';
  presupuestoMax: string = '';
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
      presupuestoMin: this.presupuestoMin,
      presupuestoMax: this.presupuestoMax,
      ordenar: this.ordenar
    };

    console.log('Aplicando filtro:', filtro);

    this.usuarioService.buscarUsuarios(filtro).subscribe({
      next: (usuarios: any[]) => {
        console.log('Resultados recibidos:', usuarios.length, 'usuarios');
        this.resultados.emit(usuarios);
      },
      error: (err: any) => {
        console.error('Error en búsqueda:', err);
      }
    });
  }

  limpiarFiltros(): void {
    console.log('Limpiando filtros...');
    this.nombre = '';
    this.especializacion = '';
    this.presupuestoMin = '';
    this.presupuestoMax = '';
    this.ordenar = 'relevancia';
    console.log('Filtros limpiados');
    this.buscar();
    console.log('Búsqueda ejecutada después de limpiar');
  }
}