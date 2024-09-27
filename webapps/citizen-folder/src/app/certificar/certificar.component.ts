import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // Importamos HttpClient para hacer la solicitud a la API
import { Router } from '@angular/router';

@Component({
  selector: 'app-certificar',
  templateUrl: './certificar.component.html',
  styleUrls: ['./certificar.component.css']
})
export class CertificarComponent implements OnInit {
  documents: any[] = []; // Lista de documentos cargados
  selectedDocument: any = null; // Documento seleccionado
  apiUrl: string = '/api/documents/api/documents'; // API para listar documentos

  
  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.verifyToken(); // Verificar el token antes de cargar los documentos
    this.loadDocuments(); // Cargar la lista de documentos al iniciar
  }

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

  // Método para seleccionar un solo documento
  selectDocument(doc: any): void {
    this.selectedDocument = doc;
  }

  // Método para enviar el documento seleccionado para certificación
  certifyDocument(): void {
    if (this.selectedDocument) {
      console.log('Certificando el documento:', this.selectedDocument);
      const slug = this.selectedDocument.slug;
      const token = sessionStorage.getItem('token');
  
      if (!token) {
        alert('No hay token disponible. Inicia sesión nuevamente.');
        this.router.navigate(['/login']);
        return;
      }
  
      const apiUrlC = `/api/documents/api/documents/certify/${slug}`; // URL de la API para certificar el documento
  
      // Hacemos la solicitud POST a la API
      this.http.post(apiUrlC, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).subscribe({
       next: (response) => {
        console.log('Documento certificado exitosamente:', response);
        alert('El documento ha sido certificado exitosamente.');
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
