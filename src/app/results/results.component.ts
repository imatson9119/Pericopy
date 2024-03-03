import { Component, OnInit } from '@angular/core';
import { ResultBank } from '../models/models';
import { StorageService } from '../services/storage.service';

export enum Views {
  single_attempt,
  heatmap
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {
  views = Views;
  view = this.views.single_attempt

  result_bank: ResultBank = {"results": []}

  constructor(private _storage_service: StorageService) {}

  ngOnInit() {
    this.result_bank = this._storage_service.getBank();
  }
}
