import { Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { trigger, transition, style, animate } from '@angular/animations';
import { PassageSelectorBodyComponent } from 'src/app/misc-components/passage-select-dialog/passage-selector-body/passage-selector-body.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Bible } from 'src/app/classes/Bible';
import { BiblePassage } from 'src/app/classes/BiblePassage';
import { PassageSelectDialogComponent } from 'src/app/misc-components/passage-select-dialog/passage-select-dialog.component';
import { BibleService } from 'src/app/services/bible.service';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { IResult } from 'src/app/classes/models';
import { StorageService } from 'src/app/services/storage.service';
import { getRelativeDate, intersection } from 'src/app/utils/utils';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { Goal, GoalStatus } from 'src/app/classes/Goal';

interface AttemptSelector {
  result: IResult;
  selected: boolean;
}

@Component({
  selector: 'app-new-goal-dialog',
  templateUrl: './new-goal-dialog.component.html',
  styleUrls: ['./new-goal-dialog.component.scss'],
  standalone: true,
  imports: [PassageSelectorBodyComponent, MatDialogModule, MatButtonModule, CommonModule, MatRadioModule, FormsModule, MatCheckboxModule, MatTableModule, MatPaginatorModule, MatIconModule],
  animations: [
    trigger('stepAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class NewGoalDialogComponent implements OnDestroy {
  currentStep = 1;
  totalSteps = 3;
  providedOptions: BiblePassage[] = [];
  passage: BiblePassage | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  memorized: boolean = false;
  attempts: AttemptSelector[] = [];
  displayedColumns: string[] = ['select', 'passage', 'date'];
  dataSource = new MatTableDataSource<AttemptSelector>();


  @ViewChild(MatPaginator) set content(content: MatPaginator) {
    if(content) {
      this.dataSource.paginator = content;
      this.dataSource.paginator.firstPage();
    }
 }

  getRelativeDate = getRelativeDate;

  constructor(
    private _bibleService: BibleService,
    private _dialogRef: MatDialogRef<PassageSelectDialogComponent>,
    private _storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      if (data.options) this.providedOptions = data.options
    }
    this.subscriptions.push(
      this._bibleService.curBible.subscribe((bible) => {
        this.bible = bible;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Select a passage';
      case 2: return 'Goal status';
      case 3: return 'Import attempts';
      default: return '';
    }
  }

  canProceed(): boolean {
    if (this.currentStep === 1) {
      return !!this.passage;
    }
    return true;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    } else {
      this.submit();
    }

    if (this.currentStep === 2) {
      this.loadAttempts();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submit(): void {
    // Handle form submission
    this._dialogRef.close();
  }

  loadAttempts(): void {
    // Get all attemtps that intersect with the selected passage
    this.attempts = [...this._storageService.getAttempts().values()].filter((a) => {
      return intersection(this.passage!.i, this.passage!.j, a.diff.i, a.diff.j);
    }).sort((a,b) => {
      return b.timestamp - a.timestamp;
    }).map((a) => {
      return { result: a, selected: false };
    });
    this.dataSource.data = this.attempts;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getPassageName(result: IResult): string {
    return this.bible ? this.bible.getPassage(result.diff.i, result.diff.j).toString() : '';
  }

  isAllSelected(): boolean {
    return this.attempts.length > 0 && this.attempts.every((a) => a.selected);
  }

  isOneSelected(): boolean {
    return this.attempts.length > 0 && this.attempts.some((a) => a.selected);
  }

  masterToggle(): void {
    let value = !this.isAllSelected();
    this.attempts.forEach((a) => a.selected = value);
  }

  createGoal(): void {
    const selectedAttempts: IResult[] = this.attempts.filter((a) => a.selected).map((a) => a.result);
    let goal = Goal.createGoal(
      this.passage!,
      this.bible!,
      selectedAttempts,
      this.memorized ? GoalStatus.MAINTAINING : GoalStatus.MEMORIZING
    );
    this._storageService.storeGoal(goal);
    this._dialogRef.close(goal);
  }
}