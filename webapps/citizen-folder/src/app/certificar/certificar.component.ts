import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Importamos HttpClient para hacer la solicitud a la API
import { Router } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-certificar',
  templateUrl: './certificar.component.html',
  styleUrls: ['./certificar.component.css']
})
export class CertificarComponent implements OnInit {
  documents: any[] = []; // Lista de documentos cargados
  filteredDocuments: any[] = []; // Documentos filtrados por búsqueda
  searchQuery: string = ''; // Búsqueda
  selectedDocument: any = null; // Documento seleccionado
  apiUrl: string = 'https://api.fastidentify.com/documents/api/documents'; // API para listar documentos

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.verifyToken(); // Verificar el token antes de cargar los documentos
    this.loadDocuments(); // Cargar la lista de documentos al iniciar
  }

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
            this.documents = response.results.map((doc: any) => ({
              name: doc.path,
              size: (doc.size / 1024).toFixed(2), // Convertimos el tamaño de bytes a KB
              modified: doc.last_modified, // Usamos la fecha de modificación del documento
              path: doc.path, // Usamos este campo para operaciones futuras si es necesario
              status: doc.status
            }));
          } else {
            console.error('La propiedad "results" no está en la respuesta.');
          }
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

  onSearch(): void {
    this.filteredDocuments = this.documents.filter(doc =>
      doc.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // Método para seleccionar un solo documento
  selectDocument(doc: any): void {
    // Solo permitir seleccionar un documento a la vez
    if (this.selectedDocument === doc) {
      this.selectedDocument = null; // Deseleccionar si el mismo documento se vuelve a hacer clic
    } else {
      this.selectedDocument = doc; // Seleccionar el nuevo documento
    }
  }

  // Método para enviar el documento seleccionado para certificación
  certifyDocument(): void {
    if (this.selectedDocument) {
      console.log('Certificando el documento:', this.selectedDocument);
      const slug = this.selectedDocument.path; // Usamos el path del documento como identificador
      const token = sessionStorage.getItem('token');

      if (!token) {
        alert('No hay token disponible. Inicia sesión nuevamente.');
        this.router.navigate(['/login']);
        return;
      }

      const apiUrlC = `https://api.fastidentify.com/documents/api/documents/certify/${slug}`; // URL de la API para certificar el documento

      // Hacemos la solicitud POST a la API
      this.http.post(apiUrlC, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).subscribe({
        next: (response) => {
          console.log('Documento certificado exitosamente:', response);
          alert('El documento ha sido certificado exitosamente.');
          this.loadDocuments();
        },
        error: (error) => {
          console.error('Error al certificar el documento:', error);
          alert('Hubo un error al certificar el documento. Inténtalo nuevamente.');
        }
      });
    } else {
      alert('Debes seleccionar un documento para certificar.');
    }
  }

  // Navegación
  goToMainPage(): void {
    this.router.navigate(['/main-page']);
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
