import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DonatePopupComponent } from './donate-popup/donate-popup.component';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent {

  constructor(private dialog: MatDialog) { }

  openDonatePopup() {
    this.dialog.open(DonatePopupComponent);
  }
}
