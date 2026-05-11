import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../usuario.service';

@Component({
    selector: 'app-registro',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './registro.component.html',
    styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
    usuario = {
        name: '',
        email: '',
        password: ''
    };

    constructor(private usuarioService: UsuarioService, private router: Router) { }

    enviarRegistro() {
        if (!this.usuario.name || !this.usuario.email || !this.usuario.password) {
            alert('Por favor completa todos los campos de registro.');
            return;
        }

        this.usuarioService.registrarUsuario(this.usuario).subscribe({
            next: (respuesta: any) => {
                alert('Registro exitoso');
                this.router.navigate(['/login']);
            },
            error: (error: any) => {
                const mensaje = error?.error?.error || 'Error al registrar';
                alert(mensaje);
                console.error('Error de registro:', error);
            }
        });
    }
}