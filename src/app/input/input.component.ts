import {
  AfterViewChecked,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';
import { BibleService } from '../services/bible.service';
import { MatDialog } from '@angular/material/dialog';
import { PassageSelectDialogComponent } from '../misc-components/passage-select-dialog/passage-select-dialog.component';
import { BiblePassage } from '../classes/BiblePassage';
import { getAttemptText, intersection, sanitizeText } from '../utils/utils';
import { BibleDiff, BiblePointer, DiffType, getRatingFromAttempt, IResult } from '../classes/models';
import { v4 as uuidv4 } from 'uuid';
import { Bible } from '../classes/Bible';
import { Subscription } from 'rxjs';
import { DifficultyDialogComponent } from './difficulty-dialog/difficulty-dialog.component';
import { SelectionType } from '../misc-components/verse-selector/verse-selector.component';

declare const annyang: any;

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent
  implements AfterViewChecked, OnDestroy
{
  attempt = '';
  annyang = annyang;
  recording = false;
  detectPassage = true;
  editingId = '';
  startRef: BiblePointer | undefined = undefined;
  endRef: BiblePointer | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  SelectionType = SelectionType;

  @ViewChild('input') input: ElementRef | null = null;
  @ViewChild('inputParent') inputParent: ElementRef | null = null;

  constructor(
    private _storageService: StorageService,
    private _bibleService: BibleService,
    private router: Router,
    private _dialog: MatDialog,
    private ngZone: NgZone
  ) {
    this.subscriptions.push(
      this._bibleService.curBible.subscribe((bible) => {
        if (bible) {
          this.bible = bible;
  
          const queryParams = this.router.parseUrl(this.router.url).queryParams;
          let id = queryParams['id'];
          let i = queryParams['i'];
          let j = queryParams['j'];
  
          if (i < j) {
            let start = this.bible.get(i); 
            let end = this.bible.get(j-1); 

            this.startRef = {
              book: start.book,
              chapter: start.chapter,
              verse: start.verse,
              index: i - start.verse.m.i,
            };
            this.endRef = {
              book: end.book,
              chapter: end.chapter,
              verse: end.verse,
              index: j - end.verse.m.i - 1,
            }
            this.detectPassage = false;
          }
        
          if (id != undefined) {
            this.editResult(id);
          } else {
            this.router.navigateByUrl('/recite');
          }
        }
      })
    );
    annyang.addCallback('result', (userSaid: string[] | undefined) => {
      if (userSaid && userSaid.length > 0) {
        ngZone.run(() => {
          if (
            this.attempt.length > 0 &&
            this.attempt[this.attempt.length - 1] !== ' '
          ) {
            this.attempt += ' ';
          }
          this.attempt += userSaid[0].trim();
        });
        this.adjustInputHeight();
      }
    });
    annyang.addCallback('end', () => {
      ngZone.run(() => {
        this.recording = false;
      });
    });
    annyang.addCallback('start', () => {
      ngZone.run(() => {
        this.recording = true;
      });
    });
  }

  ngAfterViewChecked(): void {
    this.adjustInputHeight();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  valid() {
    return ( 
      this.attempt.trim().length > 0 &&
      (this.detectPassage
        ? true
        : this.startRef &&
          this.endRef &&
          this.startRef.verse.m.i <= this.endRef.verse.m.i)
    );
  }

  editResult(id: string) {
    if (!this.bible) {
      return;
    }
    let result = this._storageService.getAttempt(id);
    if (result === undefined) {
      this.router.navigateByUrl('/recite');
      return;
    }
    this.attempt = result.raw ? result.raw : getAttemptText(result);
    // this.detectPassage = false;
    // let start = this.bible.get(result.diff.i);
    // let end = this.bible.get(result.diff.j - 1);
    // this.startRef = {
    //   book: start.book,
    //   chapter: start.chapter,
    //   verse: start.verse,
    //   index: result.diff.i - start.verse.m.i,
    // };
    // this.endRef = { // End is inclusive
    //   book: end.book,
    //   chapter: end.chapter,
    //   verse: end.verse,
    //   index: result.diff.j - end.verse.m.i - 1,
    // };
    this.editingId = id;
  }

  submit() {
    if (!this.valid() || !this.bible) {
      return;
    }
    this.annyang.abort();
    if (this.detectPassage) {
      let anchors = this.bible.anchorText(this.attempt);
      if (!this.canAutoLock(anchors, this.attempt)) {
        this._dialog
          .open(PassageSelectDialogComponent, {
            data: {
              title: 'Select a Passage',
              subtitle:
                "Oops, it looks like we couldn't find the passage you were reciting. Specify below!",
              options: anchors.map((a) => a[0]),
            },
          })
          .afterClosed()
          .subscribe((passage: BiblePassage) => {
            if (passage && this.bible) {
              this.getAndStoreDiff(passage);
            }
          });
      } else {
        this.getAndStoreDiff(anchors[0][0]);
      }
    } else {
      if (!this.startRef || !this.endRef) {
        return;
      }
      let start = this.startRef.verse.m.i + this.startRef.index;
      let end = this.endRef.verse.m.i + this.endRef.index;
      this.getAndStoreDiff(this.bible.getPassage(start, end));
    }
  }

  getAndStoreDiff(passage: BiblePassage) {
    if (!this.bible) {
      return;
    }
    let diff = this.bible.getBibleDiff(this.attempt, passage.i, passage.j);
    if (!diff) {
      throw new Error('Error getting diff');
    }
    let attempt: IResult = this.processDiff(diff);
    if (!this.editingId) {
      const dialogRef = this._dialog.open(DifficultyDialogComponent);
      dialogRef.afterClosed().subscribe(result => {
        if (result === undefined) {
          return;
        }
        attempt.difficulty = result;
        attempt.difficulty = getRatingFromAttempt(attempt);
        this.storeAttempt(attempt);
      });
    } else {
      this.storeAttempt(attempt);
    }
  }

  storeAttempt(attempt: IResult) {
    this._storageService.storeAttempt(attempt);
    this.router.navigate(['/results'], { queryParams: { id: attempt.id } });
  }

  canAutoLock(anchorList: [BiblePassage, number][], attempt: string) {
    if (anchorList.length === 0) {
      return false;
    }
    let topAnchor = anchorList[0][0];
    return (
      anchorList[0][1] === 1 &&
      topAnchor.j - topAnchor.i < sanitizeText(attempt).split(/\s+/).length * 2
    );
  }

  adjustInputHeight() {
    if (this.input && this.inputParent) {
      let prevParentMinHeight = this.inputParent.nativeElement.style.minHeight;
      this.inputParent.nativeElement.style.minHeight =
        this.inputParent.nativeElement.offsetHeight + 'px';
      this.input.nativeElement.classList.add('measure-element');
      let height = this.input.nativeElement.scrollHeight;
      this.input.nativeElement.style.height = height + 'px';
      this.input.nativeElement.classList.remove('measure-element');
      this.inputParent.nativeElement.style.minHeight = prevParentMinHeight;
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Enter') {
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        this.attempt += '\n';
        return;
      }
      e.preventDefault();
      this.submit();
    }
  }

  toggleVoice() {
    if (annyang.isListening()) {
      annyang.abort();
    } else {
      annyang.start();
    }
  }

  processDiff(diff: BibleDiff): IResult {
    const prevResult = this._storageService.getAttempt(this.editingId);
    let totalCorrect = 0;
    let totalWords = 0;
    for (let book of diff.v) {
      for (let chapter of book.v) {
        for (let verse of chapter.v) {
          for (let change of verse.v) {
            if (change.t === DiffType.UNCHANGED) {
              totalCorrect += change.v.length;
            }
            totalWords += change.v.length;
          }
        }
      }
    }
    let score = totalCorrect / totalWords;
    let id = this.editingId ? this.editingId : uuidv4();
    
    let goalsApplied = new Set<string>();
    if (prevResult) {
      goalsApplied = prevResult.goals;
    } else {
      for (let goal of this._storageService.getGoals().values()) {
        if (intersection(goal.i, goal.j, diff.i, diff.j)) {
          goal.attempts.add(id);
          goalsApplied.add(goal.id);
        }
      }
    }

    return {
      id: id,
      diff: diff,
      timestamp: prevResult ? prevResult.timestamp : Date.now(),
      score: score,
      raw: this.attempt,
      goals: goalsApplied,
      difficulty: prevResult ? prevResult.difficulty : undefined,
    }
  }

  togglePassageSelection() {
    this.detectPassage = !this.detectPassage;
  }
}
