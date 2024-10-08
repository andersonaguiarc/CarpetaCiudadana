import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-agregar-documento',
  templateUrl: './agregar-documento.component.html',
  styleUrls: ['./agregar-documento.component.css']
})
export class AgregarDocumentoComponent {
  selectedFile: File | null = null;
  fileSlug: string = '';
  isFileLoaded: boolean = false;  // Indicador de que el archivo fue cargado

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient, private router: Router,   private toastr: ToastrService) { }
  
  ngOnInit(): void {
    this.verifyToken(); // Verificar el token antes de cargar los documentos
  }

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

  // Método para manejar la selección del archivo
  onFileSelect(event: any): void {
    const target = event.target as HTMLInputElement;
    const files = target?.files;
    
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.fileSlug = this.generateSlug(this.selectedFile.name);
      this.isFileLoaded = true; // Activar el indicador
    } else {
      this.showToast('No se ha seleccionado ningún archivo.','Seleccione un archivo','error')
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
      this.http.post(`https://api.fastidentify.com/documents/api/documents/${this.fileSlug}`, fileContents, { headers })
        .subscribe(
          (response) => {
            console.log('Archivo subido exitosamente:', response);
            this.showToast('Documento agregado con éxito','Exito','success')
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
    this.router.navigate(['/main-page']);
  }

  goToCertificar(): void {
    this.router.navigate(['/certificar']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
