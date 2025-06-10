import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-delete-attempt-dialog',
    templateUrl: './delete-attempt-dialog.component.html',
    styleUrls: ['./delete-attempt-dialog.component.scss'],
    imports: [
      MatDialogModule,
      MatButtonModule,
      MatIconModule
    ]
})
export class DeleteAttemptDialogComponent {

}
