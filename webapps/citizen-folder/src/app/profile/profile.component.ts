import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = {}; // Detalles del usuario

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.verifyToken(); // Verificar el token antes de cargar el perfil
    this.loadUserProfile(); // Cargar la información del perfil del usuario
  }

  verifyToken(): void {
    const token = sessionStorage.getItem('token');
    if (!token) {
      // Si no hay token, redirigir al login
      this.router.navigate(['/login']);
    }
  }

  loadUserProfile(): void {
    const token = sessionStorage.getItem('token');
    if (token) {
      // Cargar los detalles del perfil desde la API
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any>('/api/users/api/citizens/user', { headers }).subscribe({
        next: (response) => {
          this.user = response;
        },
        error: (error) => {
          console.error('Error al cargar el perfil:', error);
          alert('Error al cargar la información del perfil');
        }
      });
    } else {
      console.error('No se encontró token');
      this.router.navigate(['/login']);
    }
  }

  // Navegación
  goToMainPage(): void {
    this.router.navigate(['/main-page']);
  }

  goToTransferRequest(): void {
    this.router.navigate(['/transferencia']);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
