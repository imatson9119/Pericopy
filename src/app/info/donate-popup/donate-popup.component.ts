import { Component } from '@angular/core';
import { MatDialogActions, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-donate-popup',
    templateUrl: './donate-popup.component.html',
    styleUrl: './donate-popup.component.scss',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, MatDialogActions, MatDialogContent]
})
export class DonatePopupComponent {
}
