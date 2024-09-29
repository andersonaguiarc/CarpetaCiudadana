import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transferencia',
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.css']
})
export class TransferenciaComponent implements OnInit {
  operators: any[] = [];
  selectedOperator: string = '';
  apiUrlOperators: string = 'http://api.fastidentify.com/operators/api/operators'; // API para obtener operadores
  apiUrlTransfer: string = 'http://api.fastidentify.com/users/api/citizens/transfer'; // API para hacer la transferencia

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.verifyToken();
    this.loadOperators();
  }

  // Verificar el token de autenticación
  verifyToken(): void {
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  // Cargar lista de operadores disponibles
  loadOperators(): void {
    const token = sessionStorage.getItem('token');
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any[]>(this.apiUrlOperators, { headers }).subscribe({
        next: (response) => {
          this.operators = response; // Guardamos los operadores en el array
        },
        error: (error) => {
          console.error('Error al cargar los operadores:', error);
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Método para enviar la solicitud de transferencia
  submitTransfer(): void {
    if (!this.selectedOperator) {
      alert('Debe seleccionar un operador.');
      return;
    }

    const token = sessionStorage.getItem('token');
    const citizenId = '1234567890'; // Este ID debe ser dinámico dependiendo del usuario autenticado

    const body = {
      citizenId: citizenId,
      transferTo: this.selectedOperator
    };

    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.patch(this.apiUrlTransfer, body, { headers }).subscribe({
        next: (response) => {
          alert('Transferencia realizada con éxito.');
          this.router.navigate(['/proceso-transferencia']); // Redirigir a pantalla de confirmación
        },
        error: (error) => {
          console.error('Error al realizar la transferencia:', error);
        }
      });
    }
  }

  goToMainPage(): void {
    this.router.navigate(['/main-page']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
