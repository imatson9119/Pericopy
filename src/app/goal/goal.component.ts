import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Bible } from '../classes/Bible';
import { Goal, IResult } from '../classes/models';
import { BibleService } from '../services/bible.service';
import { StorageService } from '../services/storage.service';
import { getRelativeDate, intersection } from '../utils/utils';
import { DeleteGoalDialogComponent } from './delete-goal-dialog/delete-goal-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-goal',
  templateUrl: './goal.component.html',
  styleUrl: './goal.component.scss',
})
export class GoalComponent implements AfterViewInit, OnDestroy, OnInit{
  goalId = '';
  attempts: Map<string, IResult> = new Map();

  goal: Goal | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  displayedColumns: string[] = ['time', 'title', 'score', 'actions'];
  dataSource = new MatTableDataSource<IResult>([]);
  diffTypeData = {
    labels: [
      'Added',
      'Removed',
      'Correct'
    ],
    datasets: [{
      label: 'Total',
      data: [0, 0, 0],
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(100, 100, 100)',
        'rgb(140 211 132)'
      ],
      hoverOffset: 4
    }]
  };
  
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort = new MatSort(({ id: 'time', start: 'desc'}) as MatSortable);

  constructor(
    private _router: Router,
    private _storageService: StorageService,
    private _bibleService: BibleService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    
    let id = this._router.parseUrl(this._router.url).queryParams['id'];
    if (id != undefined) {
      this.setResult(id);
    } else {
      this._router.navigateByUrl('');
    }

    this.subscriptions.push(
      this._bibleService.curBible.subscribe((bible) => {
        this.bible = bible;
        if (this.bible) {
          if (this.bible?.m.t !== this.goal?.translation) {
            this._router.navigateByUrl('');
          }
          this._storageService.getAttempts(this.bible.m.t).forEach((result) => {
            if (this.goal && intersection(this.goal.i, this.goal.j, result.diff.i, result.diff.j)) {
              this.attempts.set(result.id, result);
            }
          });
          this.dataSource.data = Array.from(this.attempts.values()).sort((a, b) => b.timestamp - a.timestamp);
          this.loadStats();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngAfterViewInit() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'time': return item.timestamp;
        case 'title': return item.diff.p;
        case 'score': return item.score;
        default: return '';
      }
    };
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = (data, filter) => {
      return data.diff.p.toLowerCase().includes(filter);
    }
    this.dataSource.sort = this.sort;
  }

  setResult(id: string): void {
    let goals = this._storageService.getGoals();
    if (!goals.has(id)) {
      this._router.navigateByUrl('');
      return;
    }
    this.goalId = id;
    this.goal = goals.get(id);
  }

  deleteGoal(): void {
    if (this.goal === undefined || this.goalId === '') {
      return;
    }
    this.dialog
      .open(DeleteGoalDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this._storageService.deleteGoal(this.goalId);
          this.snackbar.open('Goal deleted.', 'Dismiss', { duration: 2000 });
          this._router.navigateByUrl('');
        }
      });
  }

  getLastAttemptText(goal: Goal) {
    let lastAttempt = undefined;
    for (let attemptId of goal.attempts) {
      let attempt = this.attempts.get(attemptId);
      if (attempt && (lastAttempt == undefined || attempt.timestamp > lastAttempt.timestamp)) {
        lastAttempt = attempt;
      }
    }
    return lastAttempt ? `Last attempt ${getRelativeDate(lastAttempt.timestamp)}` : 'No attempts yet';
  }

  makeAttempt() {
    this._router.navigateByUrl('/input');
  }

  loadStats() {
    if (!this.goal) {
      return;
    }


    let data = [0, 0, 0];
    for (let attempt of this.attempts.values()) {
      for(let bookDiff of attempt.diff.v){
        if(!intersection(this.goal.i, this.goal.j, bookDiff.m.i, bookDiff.m.i + bookDiff.m.l)){
          continue;
        }
        for(let chapterDiff of bookDiff.v){
          if(!intersection(this.goal.i, this.goal.j, chapterDiff.m.i, chapterDiff.m.i + chapterDiff.m.l)){
            continue;
          }
          for(let verseDiff of chapterDiff.v){
            if (!intersection(this.goal.i, this.goal.j, verseDiff.m.i, verseDiff.m.i + verseDiff.m.l)){
              continue;
            }
            for (let diff of verseDiff.v){
              data[diff.t] += diff.v.length;
            }
          }
        }
      }
    }
    this.diffTypeData.datasets[0].data = data;
  }

  formatScore(score: number): string {
    return Math.round(score * 100).toString() + '%';
  } 

  getRelativeTime(timestamp: number): string | null{
    return getRelativeDate(timestamp);
  }

  loadResult(id: string) {
    this._router.navigate(['/results'], { queryParams: { id: id } }); 
  }
}
