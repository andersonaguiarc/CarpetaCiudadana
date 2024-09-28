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

  // Método para subir el archivo como binario sin FormData
  onSubmit(): void {
    if (!this.selectedFile) {
      console.error('No se ha seleccionado ningún archivo.');
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('Token no disponible.');
      return;
    }

    // Leer el archivo como binario usando FileReader
    const reader = new FileReader();
    reader.onload = () => {
      const fileContents = reader.result as ArrayBuffer;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
      });

      // Enviar el archivo binario directamente en el cuerpo de la solicitud
      this.http.post(`/api/documents/api/documents/${this.fileSlug}`, fileContents, { headers })
        .subscribe(
          (response) => {
            console.log('Archivo subido exitosamente:', response);
            alert('Documento agregado con éxito'); // Mostrar alerta
            this.resetUploadArea(); // Limpiar la zona de arrastre
          },
          (error) => {
            console.error('Error al subir el archivo:', error);
          }
        );
    };

    reader.onerror = (error) => {
      console.error('Error al leer el archivo:', error);
    };

    // Leer el archivo seleccionado como ArrayBuffer (binario)
    reader.readAsArrayBuffer(this.selectedFile);
  }

  // Método para resetear la zona de arrastre y la selección del archivo
  resetUploadArea(): void {
    this.selectedFile = null;
    this.fileSlug = '';
    this.isFileLoaded = false;
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
