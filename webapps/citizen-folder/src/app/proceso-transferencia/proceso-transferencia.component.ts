import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-proceso-transferencia',
  templateUrl: './proceso-transferencia.component.html',
  styleUrls: ['./proceso-transferencia.component.css']
})
export class ProcesoTransferenciaComponent {

  constructor(private router: Router) {}

  finalizarTransferencia(): void {
    sessionStorage.removeItem('token');
    this.router.navigate(['/login']);// Volver a la página principal después de la transferencia
  }
}
