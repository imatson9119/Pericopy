import { Component, OnDestroy } from '@angular/core';
import { Goal, IResult } from '../classes/models';
import { StorageService } from '../services/storage.service';
import { MatDialog } from '@angular/material/dialog';
import { BibleService } from '../services/bible.service';
import { getRelativeDate, intersection } from '../utils/utils';
import { v4 as uuidv4 } from 'uuid';
import { DeleteGoalDialogComponent } from '../goal/delete-goal-dialog/delete-goal-dialog.component';
import { Bible } from '../classes/Bible';
import { Subscription } from 'rxjs';
import { PassageSelectDialogComponent } from '../passage-select-dialog.component/passage-select-dialog.component';
import { Router } from '@angular/router';
import { BiblePassage } from '../classes/BiblePassage';

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

  constructor(private _storageService: StorageService, private dialog: MatDialog, private _bibleService: BibleService, private router: Router) {
    
    this.subscriptions.push(this._bibleService.curBible.subscribe(
      (bible) => {
        this.bible = bible;
        if(this.bible) {
          this.attempts = this._storageService.getAttempts(this.bible.m.t);
          this.goals = [...this._storageService.getGoals(this.bible.m.t).values()].sort((a,b) => b.t - a.t);
          this.getStats();
        }
      }
    ));
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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

    this.dialog.open(PassageSelectDialogComponent, {
      data: {
        title: 'Create a New Goal',
        subtitle:
          "Select a passage to track your progress and gain insights on your proficiency!",
        options: passages,
      },
    }).afterClosed().subscribe((range: [number,number] | undefined) => {
      if (range && this.bible) {
        let id = uuidv4();
        let goal: Goal = {
          id: id,
          i: range[0],
          j: range[1],
          t: Date.now(),
          title: this.bible.getPassage(range[0], range[1]).toString(),
          translation: this.bible.m.t,
          attempts: new Set(this.getIntersectingAttempts(range[0], range[1]))
        }
        this._storageService.storeGoal(goal);
        this.goals.unshift(goal);
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

  getLastAttemptText(goal: Goal) {
    let lastAttempt = undefined;
    for (let attemptId of goal.attempts) {
      let attempt = this.attempts.get(attemptId);
      if (attempt && (lastAttempt == undefined || attempt.timestamp > lastAttempt.timestamp)) {
        lastAttempt = attempt;
      }
    }
    return lastAttempt ? `Attempted ${getRelativeDate(lastAttempt.timestamp)}` : 'No attempts yet';
  }

  trackByGoalId(index: number, goal: Goal) {
    return goal.id;
  }

  makeAttempt() {
    this.router.navigateByUrl('/input');
  }

}
