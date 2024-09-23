import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],  // Documento de 10 dígitos
      name: ['', Validators.required],
      address: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', Validators.required]
    });
  }

  // Método para manejar el registro
  onRegister(): void {
    if (this.registerForm.invalid) {
      console.error("Formulario inválido");
      return;
    }

    const formData = {
      id: this.registerForm.value.id,
      name: this.registerForm.value.name,
      address: this.registerForm.value.address,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      password_confirm: this.registerForm.value.password_confirm
    };

    // Verificar si las contraseñas coinciden
    if (formData.password !== formData.password_confirm) {
      console.error("Las contraseñas no coinciden");
      return;
    }

    // Realizar la solicitud POST usando el proxy
    this.http.post('/api/registration-exp/api/citizens/registrations', formData)
    .subscribe({
      next: (response) => {
        console.log('Usuario registrado con éxito', response); 
      },
      error: (error) => {
        console.error('Error al registrar usuario:', error);
      }
    });
  }
}
