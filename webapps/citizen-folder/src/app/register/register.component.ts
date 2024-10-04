import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

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
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],  // Documento de 10 dígitos
      name: ['', Validators.required],
      address: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[/!@#$%^&*(),.?":{}|<>])(?=.*[a-zA-Z]).{8,}$/) // Al menos una mayúscula, un carácter especial y longitud mínima de 8
      ]],
      password_confirm: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para comparar contraseñas
  passwordMatchValidator(formGroup: AbstractControl): { [key: string]: boolean } | null {
    const password = formGroup.get('password');
    const password_confirm = formGroup.get('password_confirm');
    if (password && password_confirm && password.value !== password_confirm.value) {
      return { 'mismatch': true };
    }
    return null;
  }

  // Método separado para mostrar los toasts
  showToast(message: string, title: string, type: 'success' | 'error'): void {
    const toastElement = document.querySelector('.toast-center');
    if (toastElement) {
      toastElement.classList.remove('hide'); // Muestra el toast
    }

    if (type === 'success') {
      this.toastr.success(message, title, {
        disableTimeOut: true,
        closeButton: true,
        positionClass: 'toast-center'
      }).onHidden.subscribe(() => {
        this.hideToast();
      });
    } else if (type === 'error') {
      this.toastr.error(message, title, {
        disableTimeOut: true,
        closeButton: true,
        positionClass: 'toast-center'
      }).onHidden.subscribe(() => {
        this.hideToast();
      });
    }
  }

  // Método para ocultar el toast y limpiar cualquier mensaje
  hideToast(): void {
    const toastElement = document.querySelector('.toast-center');
    if (toastElement) {
      toastElement.classList.add('hide');
    }
    this.toastr.clear(); // Limpiar cualquier toast existente
  }

  // Método para manejar el registro
  onRegister(): void {
    if (this.registerForm.invalid) {
      this.showToast('Por favor revisa los campos del formulario.', 'Formulario inválido', 'error');
      return;
    }

    const formData = this.registerForm.value;

    // Realizar la solicitud POST usando el proxy
    this.http.post('https://api.fastidentify.com/registration-exp/api/citizens/registrations', formData)
      .subscribe({
        next: (response) => {
          this.showToast('Usuario registrado con éxito. Cierra este mensaje.', 'Registro Exitoso', 'success');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.showToast('No se recibió respuesta del servidor. Inténtalo de nuevo más tarde.', 'Error al registrar', 'error');
        }
      });
  }
}
