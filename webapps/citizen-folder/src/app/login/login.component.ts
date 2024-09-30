import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  apiUrlLogin: string = 'https://api.fastidentify.com/auth/api/citizens/login';
  apiUrlUser: string = 'https://api.fastidentify.com/users/api/citizens/user'; // API para obtener el estado del ciudadano

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
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
    this.http.post<any>(this.apiUrlLogin, loginData).subscribe({
      next: (response) => {
        if (response && response.token && isPlatformBrowser(this.platformId)) {
          // Guardar el token en sessionStorage
          sessionStorage.setItem('token', response.token);
          console.log(response.token);

          // Verificar el estado del ciudadano después de obtener el token
          this.checkCitizenStatus();
        }
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
        this.errorMessage = 'Error al iniciar sesión, por favor verifica tus credenciales.';
      }
    });
  }

  // Método para verificar el estado del ciudadano
  checkCitizenStatus(): void {
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      console.error('Token no disponible');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Llamamos a la API para obtener el estado del ciudadano
    this.http.get<any>(this.apiUrlUser, { headers }).subscribe({
      next: (response) => {
        if (response.status === 'transfered') {
          // Si el estado es "transfer", redirigir a la página de proceso de transferencia
          this.router.navigate(['/proceso-transferencia']);
        } else {
          // Si no, redirigir a la main-page
          this.router.navigate(['/main-page']);
        }
      },
      error: (error) => {
        console.error('Error al verificar el estado del ciudadano:', error);
        this.errorMessage = 'Error al verificar el estado del ciudadano.';
      }
    });
  }

  // Método para redirigir al registro
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Método para redirigir a la recuperación de contraseña
  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
