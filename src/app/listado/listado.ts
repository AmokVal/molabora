import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Especialista {
  nombre: string;
  rol: string;
  localizacion: string;
}

@Component({
  selector: 'app-listado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado.html',
  styleUrl: './listado.css'
})
export class ListadoComponent {
  // 1. Definición de Roles (Tags)
  rolesDisponibles = ['Diseñador', 'Desarrollador', 'Tester', 'Analista'];

  // Datos de ejemplo (Simulando la base de datos)
  especialistas: Especialista[] = [
    { nombre: 'Ana García', rol: 'Diseñador', localizacion: 'Madrid' },
    { nombre: 'Juan Pérez', rol: 'Desarrollador', localizacion: 'Barcelona' },
    { nombre: 'Elena Mora', rol: 'Tester', localizacion: 'Valencia' },
    { nombre: 'Luis Soler', rol: 'Analista', localizacion: 'Madrid' },
    { nombre: 'Alexandre Furelos', rol: 'Programador', localizacion: 'Galicia' },
    { nombre: 'Bruno Fernandez', rol: 'Desarrollador', localizacion: 'Sevilla' },
    { nombre: 'Izan Gallego', rol: 'Programador', localizacion: 'Madrid' },
    { nombre: 'Sergio Fuentes', rol: 'Analista', localizacion: 'Sevilla' },
    { nombre: 'Samuel Espinoza', rol: 'Diseñador', localizacion: 'Barcelona' },
    { nombre: 'Sheila Benavides', rol: 'Tester', localizacion: 'Bilbao'}

  ];

  filtroUsuario: string = '';
  resultados: Especialista[] = [...this.especialistas];

  // 2. FRONT-END: Filtrar datos para hacer match con el tag
  filtrarEspecialistas() {
    const busqueda = this.filtroUsuario.toLowerCase().trim();

    if (!busqueda) {
      this.resultados = [...this.especialistas];
      return;
    }

    this.resultados = this.especialistas.filter(e => 
      e.rol.toLowerCase().includes(busqueda) || 
      e.nombre.toLowerCase().includes(busqueda)
    );
  }
}
