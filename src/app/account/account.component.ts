import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account',
  imports: [
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent {

  totalStorageUsed = this.getLocalStorageSizeMB();
  authService = inject(AuthService);

  signInWithGoogle() {
    this.authService.signInWithGoogle();
  }

  getLocalStorageSizeMB() {
    let total = 0;

    for (let key in localStorage) {
      if (!localStorage.hasOwnProperty(key)) continue;
      const value = localStorage.getItem(key);
      if (!value) continue;
      total += key.length + value.length;
    }
    const totalBytes = total * 2;
    const totalMB = totalBytes / (1024 * 1024);
    return totalMB;
  }

}

