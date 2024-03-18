import { Component } from '@angular/core';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'roman-road-webapp';
  constructor(private _storageService: StorageService) {}
  
  getAttempts() {
    return this._storageService.getAttempts();
  }
}
