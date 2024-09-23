import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainPageComponent } from './main-page/main-page.component';
import { AgregarDocumentoComponent } from './agregar-documento/agregar-documento.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { CertificarComponent } from './certificar/certificar.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Ruta por defecto al login
  { path: 'login', component: LoginComponent }, // Ruta de inicio de sesión
  { path: 'register', component: RegisterComponent }, // Ruta de registro
  { path: 'main-page', component: MainPageComponent }, // Ruta para la página principal
  { path: 'profile', component: ProfileComponent }, // Ruta para el perfil
  { path: 'certificar', component: CertificarComponent }, // Ruta para certificar documentos
  { path: 'agregar-documento', component: AgregarDocumentoComponent }, // Ruta para agregar documentos
  { path: 'forgot-password', component: ForgotPasswordComponent }, // Ruta para recuperar contraseña
  { path: 'change-password', component: ChangePasswordComponent }, // Ruta para cambiar contraseña
  { path: 'transferencia', component: TransferenciaComponent }, // Ruta para transferencia
  { path: '**', redirectTo: '/login' } // Ruta comodín para redirigir al login si no se encuentra la ruta
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
