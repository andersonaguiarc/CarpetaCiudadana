import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms'; // Importar el ReactiveFormsModule
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http'; // Importamos HttpClientModule y provideHttpClient
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MainPageComponent } from './main-page/main-page.component';
import { ProfileComponent } from './profile/profile.component';
import { CertificarComponent } from './certificar/certificar.component';
import { AgregarDocumentoComponent } from './agregar-documento/agregar-documento.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { ProcesoTransferenciaComponent } from './proceso-transferencia/proceso-transferencia.component';



@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    MainPageComponent,
    ProfileComponent,
    CertificarComponent,
    AgregarDocumentoComponent,
    ForgotPasswordComponent,
    ChangePasswordComponent,
    TransferenciaComponent,
    ProcesoTransferenciaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule,  // Asegúrate de importar HttpClientModule
    FormsModule,
    BrowserAnimationsModule, // Requerido para las animaciones de ngx-toastr
    ToastrModule.forRoot({
      positionClass: 'toast-center', // Posición del toast
      timeOut: 0, // Duración de la notificación en milisegundos
      closeButton: true,
      preventDuplicates: true
    })

  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()) // Configuración para usar fetch en lugar de XMLHttpRequest
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
