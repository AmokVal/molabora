import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroComponent {
  registroForm: FormGroup;

  // Referencias para el focus automático
  @ViewChild('nombreInput') nombreInput!: ElementRef;

  // Lista de palabras no permitidas
  private listaNegra = ['admin', 'root', 'malo', 'ofensivo']; 

  constructor(private fb: FormBuilder) {
    this.registroForm = this.fb.group({
      // Regex: Solo letras y espacios. Validators.required para que no esté vacío.
      nombreCompleto: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/),
        this.validarPalabrasProhibidas.bind(this)
      ]],
      estudios: [''], //campos//
      experiencia: [''],
      localizacion: [''],
      tipoPerfil: ['cliente']
    });
  }

  // Validador personalizado
  validarPalabrasProhibidas(control: AbstractControl): ValidationErrors | null {
    const valor = control.value?.toLowerCase();
    const esInvalido = this.listaNegra.some(palabra => valor?.includes(palabra));
    return esInvalido ? { palabraProhibida: true } : null;
  }

  enviarRegistro() {
    if (this.registroForm.invalid) {
      // Si falla el nombre, hacemos focus
      if (this.registroForm.get('nombreCompleto')?.invalid) {
        this.nombreInput.nativeElement.focus();
      }
      return;
    }

    // Si todo es correcto, se "envía" (aquí llamarías a tu API)
    console.log('Enviando datos válidos:', this.registroForm.value);
    alert('Registro enviado con éxito');
  }
}