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
  selectedOperator: string = ''; // Será el `operator_id` seleccionado
  citizenId: string = ''; // Guardamos el ID del ciudadano autenticado
  apiUrlOperators: string = 'https://api.fastidentify.com/operators/api/operators'; // API para obtener operadores
  apiUrlTransfer: string = 'https://api.fastidentify.com/transfers/api/citizens/transfer'; // API para hacer la transferencia
  apiUrlCitizen: string = 'https://api.fastidentify.com/users/api/citizens/user'; // API para obtener el ciudadano autenticado

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.verifyToken();
    this.loadCitizenId(); // Cargar el ID del ciudadano
    this.loadOperators(); // Cargar lista de operadores
  }

  // Verificar el token de autenticación
  verifyToken(): void {
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  // Cargar ID del ciudadano autenticado
  loadCitizenId(): void {
    const token = sessionStorage.getItem('token');
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any>(this.apiUrlCitizen, { headers }).subscribe({
        next: (response) => {
          this.citizenId = response.id; // Asignar el ID del ciudadano autenticado
          console.log('ID del ciudadano:', this.citizenId);
        },
        error: (error) => {
          console.error('Error al obtener el ID del ciudadano:', error);
          this.router.navigate(['/login']);
        }
      });
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
    const selectedOperatorData = this.operators.find(op => op.id === this.selectedOperator); // Encuentra el operador seleccionado
  

    if (!selectedOperatorData) {
      alert('Operador seleccionado no válido.');
      return;
    }

    const body = {
      citizenId: this.citizenId, // Usamos el ID dinámico del ciudadano autenticado
      operator_id: selectedOperatorData.id, // El ID del operador seleccionado
      operator_url: selectedOperatorData.transferAPIURL // La URL del operador seleccionado
    };

    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.patch(this.apiUrlTransfer, body, { headers }).subscribe({
        next: (response) => {
          this.router.navigate(['/proceso-transferencia']); // Redirigir a pantalla de confirmación
        },
        error: (error) => {
          console.error('Error al realizar la transferencia:', error);
          alert('Error al realizar la transferencia.');
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
