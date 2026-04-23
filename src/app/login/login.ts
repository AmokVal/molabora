import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',

})
export class LoginComponent {

  constructor(private routers: Router) { }

  public mensajeError: string = "";
  public usuario: string = "";
  public password: string = "";

  public hacerLogin(): void {
    console.log("vamos hacer login");
    if (this.usuario == "admin" && this.password == "admin") {

      console.log("Nos vamos a la pagina principal");
      this.routers.navigate(["/principal"]);

    } else {

    this.mensajeError="contraseña Incorrecta";

    }


  }
}
