import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  let token: string | null = null;

  // Check if the code is running in the browser
  if (isPlatformBrowser(platformId)) {
    token = sessionStorage.getItem('token');
  }

  if (!token) {
    // If no token is found, redirect to the login page
    router.navigate(['/login']);
    return false; // Guard will block access
  }

  return true; // Guard allows access if token exists
};