import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
    selector: 'app-delete-goal-dialog',
    templateUrl: './delete-goal-dialog.component.html',
    styleUrls: ['./delete-goal-dialog.component.scss'],
    imports: [
      MatDialogModule,
      MatButtonModule
    ]
})
export class DeleteGoalDialogComponent {

}
