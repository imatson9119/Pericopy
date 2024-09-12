import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Rating } from 'ts-fsrs';

@Component({
  selector: 'app-difficulty-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatTooltipModule, MatIconModule],
  templateUrl: './difficulty-dialog.component.html',
  styleUrl: './difficulty-dialog.component.scss'
})
export class DifficultyDialogComponent {
  
  Rating = Rating;

  constructor(public dialogRef: MatDialogRef<DifficultyDialogComponent>) {}

  onSelect(difficulty: Rating): void {
    this.dialogRef.close(difficulty);
  }
}
