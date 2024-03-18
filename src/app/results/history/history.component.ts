import { Component } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent {

  constructor(private _storageService: StorageService, private _router: Router) {}

  getAttempts() {
    return this._storageService.getAttempts();
  }

  loadResult(index: number) {
    this._router.navigate(['/results'], { queryParams: { i: index } }); 
  }
}
