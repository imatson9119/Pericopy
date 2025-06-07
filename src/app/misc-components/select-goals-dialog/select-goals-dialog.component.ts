import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PassageSelectDialogComponent } from 'src/app/misc-components/passage-select-dialog/passage-select-dialog.component';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { StorageService } from 'src/app/services/storage.service';
import { getRelativeDate } from 'src/app/utils/utils';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { Goal, GoalStatus } from 'src/app/classes/Goal';

export interface GoalSelector {
  goal: Goal;
  selected: boolean;
}

@Component({
  selector: 'app-select-goals-dialog',
  templateUrl: './select-goals-dialog.component.html',
  styleUrls: ['./select-goals-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, MatRadioModule, FormsModule, MatCheckboxModule, MatTableModule, MatPaginatorModule, MatIconModule],
})
export class SelectGoalsDialogComponent implements OnDestroy {
  subscriptions: Subscription[] = [];
  goals: GoalSelector[] = [];
  originalSelections: boolean[] = [];
  displayedColumns: string[] = ['select', 'goal', 'status'];
  dataSource = new MatTableDataSource<GoalSelector>()
  getRelativeDate = getRelativeDate;
  title = 'Select goals';
  message = 'Select goals to link to this recitation.'

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private _dialogRef: MatDialogRef<PassageSelectDialogComponent>,
    private _storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      if(data.goals) {
        this.goals = data.goals;
      } else {
        this.goals = [...this._storageService.getGoals().values()].map((g) => {
          return { goal: g, selected: false };
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
    // Sort by timestamp
    this.goals.sort((a, b) => b.goal.t - a.goal.t);
    this.originalSelections = this.goals.map((g) => g.selected);
    this.dataSource.data = this.goals;
  }

  submit(): void {
    this._dialogRef.close(this.goals.filter((g) => g.selected).map((g) => g.goal));
  }

  isAllSelected(): boolean {
    return this.goals.length > 0 && this.goals.every((a) => a.selected);
  }

  isOneSelected(): boolean {
    return this.goals.length > 0 && this.goals.some((a) => a.selected);
  }

  noChanges(): boolean {
    return this.goals.every((g, i) => g.selected === this.originalSelections[i]);
  }

  masterToggle(): void {
    let value = !this.isAllSelected();
    this.goals.forEach((a) => a.selected = value);
  }

  getGoalStatusText(goal: Goal): string {
    if (goal.archived) {
      return 'Archived';
    }
    switch (goal.status) {
      case GoalStatus.MEMORIZING: return 'Memorizing';
      case GoalStatus.MAINTAINING: return 'Maintaining';
      case GoalStatus.MASTERED: return 'Mastered';
      default: return 'Unknown';
    }
  }

  getStatusClass(goal: Goal): string {
    if (goal.archived) {
      return 'status-archived';
    }
    switch (goal.status) {
      case GoalStatus.MEMORIZING: return 'status-memorizing';
      case GoalStatus.MAINTAINING: return 'status-maintaining';
      case GoalStatus.MASTERED: return 'status-mastered';
      default: return '';
    }
  }
}