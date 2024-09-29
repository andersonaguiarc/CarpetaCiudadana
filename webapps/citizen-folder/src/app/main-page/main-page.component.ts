import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Importamos HttpClient para hacer la solicitud a la API
import { Router } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {
  documents: any[] = []; // Lista de documentos cargados
  apiUrl: string = '/api/documents/api/documents'; // API para listar documentos

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.verifyToken(); // Verificar el token antes de cargar los documentos
    this.loadDocuments(); // Cargar la lista de documentos al iniciar
  }

  // Método para verificar el JWT en sessionStorage
  verifyToken(): void {
    let token = null;
    if (isPlatformBrowser(this.platformId)) {
      token = sessionStorage.getItem('token');
    }
    if (!token) {
      // Si no hay token en sessionStorage, redirigir al login
      this.router.navigate(['/login']);
    }
  }

  // Método para cargar documentos desde la API
  loadDocuments(): void {
    let token = null;
    if (isPlatformBrowser(this.platformId)) {
      token = sessionStorage.getItem('token'); // Obtener el token de sessionStorage
    }
    if (token) {
      this.http.get<any>(this.apiUrl, {
        headers: {
          Authorization: `Bearer ${token}` // Agregar el token en el encabezado de la solicitud
        }
      }).subscribe({
        next: (response) => {
          if (response.results) {
            // Mapeamos los documentos en la estructura deseada
            this.documents = response.results.map((doc: any) => ({
              name: doc.path,
              size: (doc.size / 1024).toFixed(2), // Convertimos el tamaño de bytes a KB
              modified: doc.last_modified, // Usamos la fecha de modificación del documento
              path: doc.path // Usamos este campo para operaciones futuras si es necesario
            }));
          }
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

  // Navegación
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
