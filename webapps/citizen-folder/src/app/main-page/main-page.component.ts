import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Importamos HttpClient para hacer la solicitud a la API
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {
  documents: any[] = []; // Lista de documentos cargados
  apiUrl: string = '/api/documents/api/documents'; // API para listar documentos

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.verifyToken(); // Verificar el token antes de cargar los documentos
    this.loadDocuments(); // Cargar la lista de documentos al iniciar
  }

  // Método para verificar el JWT en sessionStorage
  verifyToken(): void {
    const token = sessionStorage.getItem('token');

    if (!token) {
      // Si no hay token en sessionStorage, redirigir al login
      this.router.navigate(['/login']);
    }
  }

  // Método para cargar documentos desde la API
  loadDocuments(): void {
    const token = sessionStorage.getItem('token'); // Obtener el token de sessionStorage

    if (token) {
      this.http.get<any[]>(this.apiUrl, {
        headers: {
          Authorization: `Bearer ${token}` // Agregar el token en el encabezado de la solicitud
        }
      }).subscribe({
        next: (response) => {
          this.documents = response;
          console.log('Documentos cargados:', this.documents);
        },
        error: (error) => {
          console.error('Error al cargar los documentos:', error);
        }
    });
    } else {
      console.error('No se encontró token');
      this.router.navigate(['/login']); // Redirigir si no hay token
    }
  }

  goToCertificar(): void {
    this.router.navigate(['/certificar']);
  }

  goToNuevoDocumento(): void {
    this.router.navigate(['/agregar-documento']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    sessionStorage.removeItem('token'); // Eliminamos el token al cerrar sesión
    this.router.navigate(['/login']);
  }
}
