import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PassageSelectDialogComponent } from 'src/app/misc-components/passage-select-dialog/passage-select-dialog.component';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { IResult } from 'src/app/classes/models';
import { StorageService } from 'src/app/services/storage.service';
import { getRelativeDate } from 'src/app/utils/utils';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';

export interface RecitationSelector {
  recitation: IResult;
  selected: boolean;
}

@Component({
  selector: 'app-select-recitations-dialog',
  templateUrl: './select-recitations-dialog.component.html',
  styleUrls: ['./select-recitations-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, MatRadioModule, FormsModule, MatCheckboxModule, MatTableModule, MatPaginatorModule, MatIconModule],
})
export class SelectRecitationsDialogComponent implements OnDestroy {
  subscriptions: Subscription[] = [];
  recitations: RecitationSelector[] = [];
  originalSelections: boolean[] = [];
  displayedColumns: string[] = ['select', 'passage', 'time'];
  dataSource = new MatTableDataSource<RecitationSelector>()
  getRelativeDate = getRelativeDate;
  title = 'Select recitations';
  message = 'Select recitations to link to this goal.'

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private _dialogRef: MatDialogRef<PassageSelectDialogComponent>,
    private _storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      if(data.recitations) {
        this.recitations = data.recitations;
      } else {
        this.recitations = [...this._storageService.getAttempts().values()]
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((r) => {
            return { recitation: r, selected: false };
          });
      }
      this.initDataSource();
      if(data.title) this.title = data.title;
      if(data.message) this.message = data.message;
    }
  }

  ngAfterViewInit(): void {
    if(this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  initDataSource(): void {
    this.originalSelections = this.recitations.map((r) => r.selected);
    this.dataSource.data = this.recitations;
  }

  submit(): void {
    this._dialogRef.close(this.recitations.filter((r) => r.selected).map((r) => r.recitation));
  }

  isAllSelected(): boolean {
    return this.recitations.length > 0 && this.recitations.every((a) => a.selected);
  }

  isOneSelected(): boolean {
    return this.recitations.length > 0 && this.recitations.some((a) => a.selected);
  }

  noChanges(): boolean {
    return this.recitations.every((r, i) => r.selected === this.originalSelections[i]);
  }

  masterToggle(): void {
    let value = !this.isAllSelected();
    this.recitations.forEach((a) => a.selected = value);
  }

  formatScore(score: number): string {
    return Math.round(score * 100) + '%';
  }
} 