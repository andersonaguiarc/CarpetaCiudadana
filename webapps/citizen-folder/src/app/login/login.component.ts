import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Importamos Validators

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder // FormBuilder para crear el formulario
  ) {
    // Definición del formulario reactivo con validadores
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Validador para email
      password: ['', [Validators.required, Validators.minLength(6)]] // Validador para la contraseña
    });
  }

  // Método para hacer login
  onLogin(): void {
    if (this.loginForm.valid) {
      const loginData = this.loginForm.value;
      this.http.post('http://134.122.25.105:30000/auth/api/citizens/login', loginData).subscribe(
        (response: any) => {
          console.log('Login exitoso:', response);
          this.router.navigate(['/main-page']); // Redirigir a la página principal
        },
        (error) => {
          console.error('Error al hacer login:', error);
        }
      );
    } else {
      console.error('Formulario inválido');
    }
  }

  // Método para redirigir a la página de registro
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
