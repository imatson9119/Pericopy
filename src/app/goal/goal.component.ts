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
import { accuracyChartConfig } from './chart-configs/accuracy-chart-config';
import { timelineConfig } from './chart-configs/timeline-chart-config';
import 'chartjs-adapter-luxon';

@Component({
  selector: 'app-goal',
  templateUrl: './goal.component.html',
  styleUrl: './goal.component.scss',
})
export class GoalComponent implements AfterViewInit, OnDestroy, OnInit {
  goalId = '';
  attempts: Map<string, IResult> = new Map();

  goal: Goal | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  displayedColumns: string[] = ['time', 'title', 'score', 'actions'];
  dataSource = new MatTableDataSource<IResult>([]);
  diffTypeConfig = accuracyChartConfig
  timelineConfig = timelineConfig;
  accuracyChart: any;
  diffTypeData: any = {
    labels: [
      'Added',
      'Added (last result)',
      'Removed',
      'Removed (last result)',
      'Correct',
      'Correct (last result)',
    ],
    datasets: [{
      label: 'Words',
      data: [0, 0, 0],
      backgroundColor: [
        'rgb(255 80 80)',
        'rgb(100, 100, 100)',
        'rgb(140 211 132)',
      ],
      hoverOffset: 4
    },
    {
      label: 'Words',
      data: [1, 2, 3],
      backgroundColor: [
        'rgb(255 150 150)',
        'rgb(200, 200, 200)',
        'rgb(187 253 179)',
      ],
      hoverOffset: 4
    }]
  };
  timelineData: any = {
    datasets: [
      {
        xAxisId: 'x',
        yAxisId: 'y',
        label: 'Accuracy',
        data: [],
        // fill: false,
        // cubicInterpolationMode: 'monotone',
        tension: 0.2,
        borderColor: function(context: any) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
  
          if (!chartArea) {
            // This case happens on initial chart load
            return;
          }
          return getGradient(ctx, chartArea);
        },
      },
      {
        xAxisId: 'x',
        yAxisId: 'y2',
        label: 'Completion',
        data: [],
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
        borderColor: '#4dc9f6',
      }  
    ],
  };
  percentMemorized = 0;
  totalWords = 0;
  totalWordsMemorized = 0;
  
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

  getPercentageMemorized(): number {
    if (!this.goal) {
      return 0;
    }

    let ranges: [number,number][] = [];
    for (let attempt of this.attempts.values()) {
      if (attempt.score > .8) {
        ranges.push([attempt.diff.i, attempt.diff.j]);
      }
    }
    let ret = this.getPercentageCoverage(this.goal.i, this.goal.j, ranges);
    this.totalWords = this.goal.j - this.goal.i;
    this.totalWordsMemorized = Math.round(this.totalWords * ret);
    return Math.round(ret * 100);
  }

  getPercentageCoverage(i: number, j: number, ranges: [number,number][]): number {
    let newRanges= [];
    for (let [x, y] of ranges) {
      if (intersection(i, j, x, y)) {
        newRanges.push([Math.max(i,x), Math.min(j,y)]);
      }
    }
    newRanges.sort((a,b) => a[0] - b[0]);
    let totalCovered = 0;
    let covered = 0;
    for (let range of newRanges) {
      if (range[0] <= covered) {
        totalCovered += Math.max(0, range[1] - covered);
        covered = Math.max(covered, range[1]);
      } else {
        totalCovered += range[1] - range[0];
        covered = range[1];
      }
    }
    return totalCovered / (j - i);
  }

  loadStats() {
    if (!this.goal) {
      return;
    }
    this.timelineData.datasets[0].data = [];
    this.timelineData.datasets[1].data = [];

    // Calculate the number of words added, removed, and correct
    let numWords = [0, 0, 0];
    let numWordsLast = [0, 0, 0];
    let maxTime = 0;
    let ranges: [number,number][] = [];
    for (let attempt of [...this.attempts.values()].sort((a, b) => a.timestamp - b.timestamp)) {
      if(attempt.score > .8){
        ranges.push([attempt.diff.i, attempt.diff.j]);
      }
      if (attempt.timestamp > maxTime) {
        maxTime = attempt.timestamp;
        numWordsLast = [0, 0, 0];
      } 
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
              numWords[diff.t] += diff.v.length;
              numWordsLast[diff.t] += diff.v.length;
            }
          }
        }
      }
      this.timelineData.datasets[0].data.push({x: attempt.timestamp, y: Math.round(100*(numWords[2]/(numWords[0] + numWords[1] + numWords[2])))});

      // TODO: Change from method call to in place calculation in the loop above to avoid O(n^2) time complexity
      this.timelineData.datasets[1].data.push({x: attempt.timestamp, y: Math.round(100 * this.getPercentageCoverage(this.goal.i, this.goal.j, ranges))});
    }

    // Update each array to be a percentage
    let totalWords = numWords[0] + numWords[1] + numWords[2];
    if (totalWords > 0) {
      numWords = numWords.map((num) => Math.round(num / totalWords* 100));
    }
    let totalWordsLast = numWordsLast[0] + numWordsLast[1] + numWordsLast[2];
    if (totalWordsLast > 0) {
      numWordsLast = numWordsLast.map((num) => Math.round(num / totalWordsLast* 100));
    }
    this.diffTypeData.datasets[0].data = numWords;
    this.diffTypeData.datasets[1].data = numWordsLast;
    this.percentMemorized = this.getPercentageMemorized();
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
function getGradient(ctx :any, chartArea: any) {
  let width, height, gradient;
  const chartWidth = chartArea.right - chartArea.left;
  const chartHeight = chartArea.bottom - chartArea.top;
  if (!gradient || width !== chartWidth || height !== chartHeight) {
    // Create the gradient because this is either the first render
    // or the size of the chart has changed
    width = chartWidth;
    height = chartHeight;
    gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(1, 'rgb(75, 192, 192)'); // green
    gradient.addColorStop(0.75, 'rgb(255, 205, 86)'); // yellow
    gradient.addColorStop(0.5, 'rgb(255, 99, 132)'); // red
  }

  return gradient;
}

