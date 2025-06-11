import { Component } from '@angular/core';

@Component({
  selector: 'app-account',
  imports: [],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent {

  totalStorageUsed = this.getLocalStorageSizeMB();

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

