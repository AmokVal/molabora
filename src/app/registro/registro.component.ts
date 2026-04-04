import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../usuario.service';

@Component({
    selector: 'app-registro',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './registro.component.html',
    styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
    usuario = {
        name: '',
        email: '',
        password: '',
        rol: 'empleado'
    };

    constructor(private usuarioService: UsuarioService, private router: Router) { }

    enviarRegistro() {
        this.usuarioService.registrarUsuario(this.usuario).subscribe({
            next: (respuesta: any) => {
                alert('Registro exitoso');
                this.router.navigate(['/login']);
            },
            error: (error: any) => {
                alert('Error al registrar');
                console.error(error);
            }
        });
    }
}