import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agregar-documento',
  templateUrl: './agregar-documento.component.html',
  styleUrls: ['./agregar-documento.component.css']
})
export class AgregarDocumentoComponent {
  selectedFile: File | null = null;
  fileSlug: string = '';
  isFileLoaded: boolean = false;  // Indicador de que el archivo fue cargado

  constructor(private http: HttpClient, private router: Router) {}

  // Método para manejar la selección del archivo
  onFileSelect(event: any): void {
    const target = event.target as HTMLInputElement;
    const files = target?.files;
    
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.fileSlug = this.generateSlug(this.selectedFile.name);
      this.isFileLoaded = true; // Activar el indicador
    } else {
      console.error('No se ha seleccionado ningún archivo.');
    }
  }

  // Convertir el nombre del archivo en un slug válido
  generateSlug(fileName: string): string {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_') // Reemplaza caracteres especiales con "_"
      .replace(/(^_|_$)/g, ''); // Elimina guiones bajos adicionales
  }

  // Método para subir el archivo
  onSubmit(): void {
    if (!this.selectedFile) {
      console.error('No se ha seleccionado ningún archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('Archivo', this.selectedFile);

    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('Token no disponible.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Enviar el archivo a la API
    this.http.post(`/api/documents/api/documents/${this.fileSlug}`, formData, { headers })
      .subscribe(
        (response) => {
          console.log('Archivo subido exitosamente:', response);
          this.isFileLoaded = false; // Resetear el indicador después de cargar
        },
        (error) => {
          console.error('Error al subir el archivo:', error);
        }
      );
  }

  // Eventos de drag and drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.fileSlug = this.generateSlug(this.selectedFile.name);
      this.isFileLoaded = true; // Activar el indicador
    }
  }

  triggerFileSelect(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  // Navegación
  goToDocuments(): void {
    this.router?.navigate(['/main-page']);
  }

  goToCertificar(): void {
    this.router?.navigate(['/certificar']);
  }

  goToProfile(): void {
    this.router?.navigate(['/profile']);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.router?.navigate(['/login']);
  }
}
