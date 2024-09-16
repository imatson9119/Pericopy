import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-new-user-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './new-user-dialog.component.html',
  styleUrl: './new-user-dialog.component.scss'
})
export class NewUserDialogComponent {
}
