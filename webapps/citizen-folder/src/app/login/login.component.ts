import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  apiUrl: string = '/api/auth/api/citizens/login';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Método para manejar el inicio de sesión
  onLogin(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Formulario inválido';
      console.error('Formulario inválido');
      return;
    }

    const loginData = this.loginForm.value;

    // Enviar la solicitud de login a la API
    this.http.post<any>(this.apiUrl, loginData).
      subscribe({
      next :(response) => {
        if (response && response.token) {
          // Guardar el token en sessionStorage
          sessionStorage.setItem('token', response.token);
          console.log(response.token);

          // Redirigir a la página principal
          this.router.navigate(['/main-page']);
        }
      },
      error :(error) => {
        console.error('Error al iniciar sesión:', error);
        this.errorMessage = 'Error al iniciar sesión, por favor verifica tus credenciales.';
      }
  });
  }

  // Método para redirigir al registro
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
