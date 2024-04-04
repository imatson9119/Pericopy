import { Component } from '@angular/core';
import { Goal, IResult } from '../classes/models';
import { StorageService } from '../services/storage.service';
import { MatDialog } from '@angular/material/dialog';
import { NewGoalComponent } from './new-goal/new-goal.component';
import { BibleService } from '../services/bible.service';
import { intersection } from '../utils/utils';
import { v4 as uuidv4 } from 'uuid';
import { DeleteGoalDialogComponent } from './delete-goal-dialog/delete-goal-dialog.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  attempts: Map<string,IResult> = new Map();
  totalWords: number = 0;
  totalVerses: number = 0;
  goals: Map<string, Goal> = new Map();

  constructor(private _storageService: StorageService, private dialog: MatDialog, private _bibleService: BibleService) {
    this.attempts = this._storageService.getAttempts();
    this.goals = this._storageService.getGoals();
    console.log(this.goals);
    this.getStats();
  }
  
  getStats() {
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

  getGoalsAsArray() {
    return Array.from(this.goals.values());
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

  getGoalProgress(goal: Goal) {
    let ranges: [number,number][] = [];
    let updatedGoal = false;
    for (let [index, resultId] of goal.attempts.entries()) {
      let result = this.attempts.get(resultId);
      if (!result) {
        goal.attempts.delete(index);
        continue;
      }
      if (result.score < .85 || !intersection(result.diff.i, result.diff.j, goal.i, goal.j)) {
        continue;
      }
      ranges.push([Math.max(goal.i,result.diff.i), Math.min(goal.j,result.diff.j)]);
    }
    if (updatedGoal) {
      this._storageService.storeGoals();
    }
    // Sort the ranges in ascending order of start bound
    ranges.sort((a,b) => a[0] - b[0]);
    let totalCovered = 0;
    let covered = 0;
    for (let range of ranges) {
      if (range[0] <= covered) {
        totalCovered += Math.max(0, range[1] - covered);
        covered = Math.max(covered, range[1]);
      } else {
        totalCovered += range[1] - range[0];
        covered = range[1];
      }
    }
    return Math.round(totalCovered / (goal.j - goal.i)*100);
  }

  addGoal() {
    this.dialog.open(NewGoalComponent).afterClosed().subscribe((range: [number,number] | undefined) => {
      if (range) {
        this._storageService.storeGoal({
          id: uuidv4(),
          i: range[0],
          j: range[1],
          t: Date.now(),
          title: this._bibleService.getPassageTitle(range[0], range[1]),
          attempts: new Set(this.getIntersectingAttempts(range[0], range[1]))
        });
      }
    });
  }

  deleteGoal(id: string) {
    this.dialog.open(DeleteGoalDialogComponent).afterClosed().subscribe(result => {
      if (result) {
        this._storageService.deleteGoal(id);
      }
    });
  }

  trackByGoalId(index: number, goal: Goal) {
    return goal.id;
  }

}
