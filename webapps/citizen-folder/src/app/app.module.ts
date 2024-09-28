import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms'; // Importar el ReactiveFormsModule
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http'; // Importamos HttpClientModule y provideHttpClient
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MainPageComponent } from './main-page/main-page.component';
import { ProfileComponent } from './profile/profile.component';
import { CertificarComponent } from './certificar/certificar.component';
import { AgregarDocumentoComponent } from './agregar-documento/agregar-documento.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';


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
    TransferenciaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule  // Asegúrate de importar HttpClientModule
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()) // Configuración para usar fetch en lugar de XMLHttpRequest
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
