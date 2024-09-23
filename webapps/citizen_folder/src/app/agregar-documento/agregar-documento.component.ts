import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-agregar-documento',
  templateUrl: './agregar-documento.component.html',
  styleUrls: ['./agregar-documento.component.css']
})
export class AgregarDocumentoComponent {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef; // Agregamos 'fileInput' con ViewChild

  selectedFile: File | null = null;

  constructor(private http: HttpClient) { }

  // Función que maneja el evento de arrastrar y soltar
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      console.log("Documento arrastrado:", this.selectedFile);
    }
  }

  // Función para permitir el comportamiento de arrastre
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  // Función para manejar la selección manual de archivos (Buscar en tu PC)
  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      console.log("Documento seleccionado:", this.selectedFile);
    }
  }

  // Método que se activará cuando se presione el botón de "Aceptar"
  onSubmit(): void {
    if (this.selectedFile) {
      this.uploadFile(this.selectedFile).subscribe(response => {
        console.log("Documento enviado con éxito", response);
      }, error => {
        console.error("Error al enviar el documento", error);
      });
    } else {
      console.error("No se ha seleccionado ningún archivo.");
    }
  }

  // Método para cargar el archivo a la API
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const apiUrl = 'https://api.example.com/upload'; // Reemplazar con el endpoint de tu API
    return this.http.post(apiUrl, formData);
  }

  // Método para abrir el input de archivos al hacer clic en el botón
  openFileSelector(): void {
    this.fileInput.nativeElement.click(); // Abre el input file
  }
}
