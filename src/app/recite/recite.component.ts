import {
  AfterViewChecked,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';
import { BibleService } from '../services/bible.service';
import { MatDialog } from '@angular/material/dialog';
import { Title, Meta } from '@angular/platform-browser';
import { PassageSelectDialogComponent } from '../misc-components/passage-select-dialog/passage-select-dialog.component';
import { BiblePassage } from '../classes/BiblePassage';
import { getAttemptText, intersection, sanitizeText } from '../utils/utils';
import { BibleDiff, DiffType, getRatingFromAttempt, IResult } from '../classes/models';
import { v4 as uuidv4 } from 'uuid';
import { Bible } from '../classes/Bible';
import { Subscription } from 'rxjs';
import { DifficultyDialogComponent } from './difficulty-dialog/difficulty-dialog.component';
import { SelectionType } from '../misc-components/verse-selector/verse-selector.component';
import { SnackbarService } from '../services/snackbar.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';

const PASSAGE_SAVE_DEBOUNCE_TIME = 5000;
const LOCALSTORAGE_KEY = 'pericopy-cached-recitations';
const CACHE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface CachedAttempt {
  passage: string;
  attempt: string;
  timestamp: number;
}

@Component({
    selector: 'app-input',
    templateUrl: './recite.component.html',
    styleUrls: ['./recite.component.scss'],
    imports: [MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule]
})
export class ReciteComponent
  implements AfterViewChecked, OnDestroy
{
  attempt = '';
  detectPassage = true;
  editingId = '';
  passage: BiblePassage | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  SelectionType = SelectionType;
  passageSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  recentAttempts: IResult[] = [];
  cachedAttempts: Map<string, CachedAttempt> | null = null;

  @ViewChild('input') input: ElementRef | null = null;
  @ViewChild('inputParent') inputParent: ElementRef | null = null;

  constructor(
    private _storageService: StorageService,
    private _bibleService: BibleService,
    private router: Router,
    private _dialog: MatDialog,
    private ngZone: NgZone,
    private titleService: Title,
    private metaService: Meta,
    private _snackbarService: SnackbarService
  ) {
    this.cachedAttempts = this.getCachedAttempts();
    this.cleanCachedAttempts();
    this.subscriptions.push(
      this._bibleService.curBible.subscribe((bible) => {
        if (bible) {
          this.bible = bible;
          this.passage = undefined;
          this.recentAttempts = Array.from(this._storageService.getAttempts().values()).sort((a,b) => b.timestamp - a.timestamp).slice(0,5);
          const queryParams = this.router.parseUrl(this.router.url).queryParams;
          let id = queryParams['id'];
          let i = queryParams['i'];
          let j = queryParams['j'];
          if (id != undefined) {
            this.editResult(id);
          } else if (i != undefined && j != undefined && i < j) {
            this.passage = this.bible.getPassage(i, j);
            this.detectPassage = false;
            const cachedAttempt = this.getCachedAttempt();
            if (cachedAttempt) {
              this.attempt = cachedAttempt.attempt;
              this._snackbarService.showEmoji('👋', 'Welcome back! We\'ve got your progress saved.', 3000);
            }
          }
          this.updatePageMetadata();
        }
      })
    );
  }

  ngAfterViewChecked(): void {
    this.adjustInputHeight();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.passageSaveTimeout) {
      clearTimeout(this.passageSaveTimeout);
    }
  }

  valid() {
    return this.attempt.trim().length > 0;
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
    this.editingId = id;
  }

  getPassage(): BiblePassage | undefined {
    const anchors = this.getAnchors();
    if (anchors.length === 0 || !this.canAutoLock(anchors, this.attempt)) {
      return undefined;
    }
    return anchors[0][0];
  }

  getAnchors(): [BiblePassage, number][] {
    return this.bible?.anchorText(this.attempt) ?? [];
  }

  submit() {
    if (!this.valid() || !this.bible) {
      return;
    }
    if (this.passageSaveTimeout) {
      clearTimeout(this.passageSaveTimeout);
    }
    this.uncacheAttempt();
    if (this.detectPassage) {
      const anchors = this.getAnchors();
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
      if (!this.passage) {
        return;
      }
      this.getAndStoreDiff(this.passage);
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

  onInput(e: Event) {
    if (!this.editingId) {
      this.cacheAttemptDebounced();
    }
  }

  openPassageSelect() {
    const dialogRef = this._dialog.open(PassageSelectDialogComponent, {
      data: {
        title: 'Select a Passage',
        subtitle: 'Please select a passage from the Bible.',
        options: this.recentAttempts.map((a) => this.bible?.getPassage(a.diff.i, a.diff.j)),
        passage: this.passage,
      },
    });
    dialogRef.afterClosed().subscribe((passage: BiblePassage) => {
      if (passage) {
        this.passage = passage;
        this.updatePageMetadata();
        this.detectPassage = false;
        this.router.navigate(['/recite'], { queryParams: { i: passage.i, j: passage.j } });
      }
    });
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

  private updatePageMetadata(): void {
    let pageTitle = 'Recitation | Pericopy';
    let pageDescription = 'Practice reciting scripture passages. Our intelligent system identifies your passage and provides detailed feedback on your recitation accuracy.';
    
    if (this.passage) {
      pageTitle = `${this.passage.toString()} - Recitation | Pericopy`;
      pageDescription = `Practice reciting the passage: ${this.passage.toString()}. Track your progress and improve your scripture memorization.`;
    }

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:url', content: 'https://pericopy.net/recite' });
  }

  getCachedAttempts(): Map<string, CachedAttempt> {
    if (this.cachedAttempts) {
      return this.cachedAttempts;
    }
    const cachedAttempts = localStorage.getItem(LOCALSTORAGE_KEY);
    if (cachedAttempts) {
      return new Map(JSON.parse(cachedAttempts));
    }
    return new Map();
  }

  cacheAttemptDebounced() {
    if (this.passageSaveTimeout) {
      clearTimeout(this.passageSaveTimeout);
    }
    this.passageSaveTimeout = setTimeout(() => {
      this.cacheAttempt();
    }, PASSAGE_SAVE_DEBOUNCE_TIME);
  }

  cacheAttempt() {
    const key = this.passage ? this.passage.toString() : 'autodetect';
    const attempt = {
      passage: key,
      attempt: this.attempt,
      timestamp: Date.now(),
    }
    if (!this.cachedAttempts) {
      this.cachedAttempts = new Map();
    }
    this.cachedAttempts.set(key, attempt);
    this.saveCachedAttempts();
    this._snackbarService.showSuccess('Progress saved.', 3000);
  }

  uncacheAttempt() {
    const key = this.passage ? this.passage.toString() : 'autodetect';
    if (this.cachedAttempts) {
      this.cachedAttempts.delete(key);
    }
    this.saveCachedAttempts();
  }

  getCachedAttempt(): CachedAttempt | undefined {
    const key = this.passage ? this.passage.toString() : 'autodetect';
    if (this.cachedAttempts) {
      return this.cachedAttempts.get(key);
    }
    return undefined;
  }

  saveCachedAttempts() {
    if (this.cachedAttempts) {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(Array.from(this.cachedAttempts.entries())));
    }
  }

  cleanCachedAttempts() {
    if (!this.cachedAttempts) return;
    const now = Date.now();
    for (let [key, attempt] of this.cachedAttempts.entries()) {
      if (now - attempt.timestamp > CACHE_EXPIRATION_TIME) {
        this.cachedAttempts.delete(key);
      }
    }
    this.saveCachedAttempts();
  }
}
