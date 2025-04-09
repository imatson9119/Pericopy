import { Component, OnDestroy, ViewChild } from '@angular/core';
import { IResult } from '../classes/models';
import { StorageService } from '../services/storage.service';
import { MatDialog } from '@angular/material/dialog';
import { BibleService } from '../services/bible.service';
import { getRelativeDate, intersection, daysUntil } from '../utils/utils';
import { Bible } from '../classes/Bible';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { BiblePassage } from '../classes/BiblePassage';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewGoalDialogComponent } from '../goal/new-goal-dialog/new-goal-dialog.component';
import { Goal, GoalStatus } from '../classes/Goal';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnDestroy {
  attempts: Map<string,IResult> = new Map();
  totalWords: number = 0;
  totalVerses: number = 0;
  goals: Goal[] = [];
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  filterValue = '';
  displayedColumns: string[] = ['title', 'time', 'status', 'dueIn'];
  dataSource = new MatTableDataSource<Goal>([]);
  showArchived = false;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort = new MatSort(({ id: 'dueIn', start: 'asc'}) as MatSortable);

  constructor(private _storageService: StorageService, private dialog: MatDialog, private _bibleService: BibleService, private router: Router, private _snackBar: MatSnackBar) {
    
    this.subscriptions.push(this._bibleService.curBible.subscribe(
      (bible) => {
        this.bible = bible;
        if(this.bible) {
          this.attempts = this._storageService.getAttempts(this.bible.m.t);
          this.goals = [...this._storageService.getGoals(this.bible.m.t).values()].sort((a,b) => b.t - a.t);
          this.dataSource = new MatTableDataSource<Goal>(this.goals);
          this.getStats();
          setTimeout(()=>{
            this.initSorting();
          }, 10);
        }
      }
    ));
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit() {
    this.initSorting();
  }

  initSorting() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'time': return Math.max(...Array.from(item.attempts.values()).map(a => this.attempts.get(a)?.timestamp || 0));
        case 'title': return item.title;
        case 'status': return this.getGoalStatusText(item);
        case 'dueIn': return this.getDueInDays(item, true);
        default: return '';
      }
    };
    this.dataSource.paginator = this.paginator;
    this.applyFilter(new Event(''));
    this.dataSource.sort = this.sort;
  }

  navigateToGoal(row: Goal) {
    this.router.navigate(['/goal'], { queryParams: { id: row.id } });
  }

  applyFilter(event: Event) {
    if(this.dataSource.paginator != null){
      this.dataSource.paginator.firstPage();
    }
    this.dataSource.filterPredicate = (data: Goal, _filter: string): boolean => {
      if (!this.showArchived && data.archived) {
        return false;
      }
      const textFilter = this.filterValue.trim().toLowerCase();
      if (textFilter && !data.title.toLowerCase().includes(textFilter)) {
        return false;
      }
      return true;
    };
    this.dataSource.filter = `text:${this.filterValue.trim().toLowerCase()};archived:${this.showArchived}`;
  }

  getStats() {
    if (!this.bible) {
      return;
    }
    let memorizedVerses: Set<number> = new Set();

    for (let result of this.attempts.values()) {
      if (result.score < .85) {
        continue;
      }
      for (let bookDiff of result.diff.v) {
        for (let chapterDiff of bookDiff.v) {
          for (let verseDiff of chapterDiff.v) {
            memorizedVerses.add(verseDiff.m.i);
            for (let wordDiff of verseDiff.v) {
              this.totalWords+=wordDiff.v.length;
            }
          }
        }
      }
    }
    this.totalVerses = memorizedVerses.size;
  }


  getIntersectingAttempts(i: number, j: number) {
    let attempts: string[] = [];
    for (let result of this.attempts.values()) {
      if (intersection(result.diff.i, result.diff.j, i, j)) {
        attempts.push(result.id); 
      }
    }
    return attempts;
  }

  addGoal() {
    if (!this.bible) {
      return;
    }
    let last5Attempts = Array.from(this.attempts.values()).sort((a,b) => b.timestamp - a.timestamp).slice(0,5);
    let passages: BiblePassage[] = [];
    for (let attempt of last5Attempts) {
      let passage = this.bible.getPassage(attempt.diff.i, attempt.diff.j);
      if (passage) {
        passages.push(passage);
      }
    }

    this.dialog.open(NewGoalDialogComponent, {
      data: {
        options: passages,
        width: '600px'
      },
    }).afterClosed().subscribe((goal: Goal | undefined) => {
      if (goal) {
        this.goals.unshift(goal);
        this.dataSource = new MatTableDataSource<Goal>(this.goals);
      } 
    });
  }

  getGoalText(goal: Goal) {
    let wordsToPreview = 20;
    if (!this.bible) {
      return '';
    }
    return goal.j - goal.i <= wordsToPreview ? 
      this.bible.getText(goal.i, goal.j) : 
      this.bible.getText(goal.i, goal.i + wordsToPreview/2) + ' ... ' + this.bible.getText(goal.j - wordsToPreview/2, goal.j);
  }

  loadGoal(goalId: string) {
    this.router.navigate(['/goal'], { queryParams: { id: goalId } });
  }

  getLastAttemptText(goal: Goal, short = false) {
    let lastAttempt = undefined;
    for (let attemptId of goal.attempts) {
      let attempt = this.attempts.get(attemptId);
      if (attempt && (lastAttempt == undefined || attempt.timestamp > lastAttempt.timestamp)) {
        lastAttempt = attempt;
      }
    }
    return lastAttempt ? `${getRelativeDate(lastAttempt.timestamp, short)}` : '-';
  }

  trackByGoalId(index: number, goal: Goal) {
    return goal.id;
  }

  makeAttempt() {
    this.router.navigateByUrl('/input');
  }

  getDueInDays(goal: Goal, sorting = false): number | string {
    if (goal.status === GoalStatus.MAINTAINING && goal.fsrsCard?.due) {
      return daysUntil(goal.fsrsCard.due);
    }
    return sorting ? Infinity : '-';
  }

  getDueInClass(goal: Goal): string {
    if (goal.status !== GoalStatus.MAINTAINING || !goal.fsrsCard?.due) {
      return '';
    }
    const days = daysUntil(goal.fsrsCard.due);
    if (days < 0) return 'overdue';
    if (days <= 3) return 'due-soon';
    return 'not-due';
  }

  getDueInDaysText(goal: Goal): string {
    const days = this.getDueInDays(goal);
    if (typeof days === 'number') {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } 
    return '-';
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
