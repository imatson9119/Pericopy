import { Component, OnInit, QueryList, ViewChildren, ElementRef, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BibleService } from '../services/bible.service';
import { BiblePassage } from '../classes/BiblePassage';
import { Bible } from '../classes/Bible';
import { PassageSelectDialogComponent } from '../misc-components/passage-select-dialog/passage-select-dialog.component';
import { MemorizationPracticeService } from './memorization-practice.service';
import { IResult } from '../classes/models';
import { Subscription } from 'rxjs';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-blanks',
  templateUrl: './blanks.component.html',
  styleUrls: ['./blanks.component.scss']
})
export class BlanksComponent implements OnInit {
  attempts: Map<string,IResult> = new Map();
  passage: BiblePassage | null = null;
  passageText: string[] = [];
  blankIndices: Set<number> = new Set();
  userAnswers: { [index: number]: string } = {};
  blankingPercent: number = 0.2;
  feedback: { correct: number; total: number; show: boolean } = { correct: 0, total: 0, show: false };
  bible: Bible | undefined;
  loading: boolean = false;
  subscriptions: Subscription[] = [];
  @ViewChildren('blankInput') blankInputs!: QueryList<ElementRef<HTMLInputElement>>;
  public Math = Math; // Expose Math for template

  // Inputs to allow for passing in a passage


  constructor(
    private dialog: MatDialog,
    private bibleService: BibleService,
    private practiceService: MemorizationPracticeService,
    private _storageService: StorageService
  ) {
    this.subscriptions.push(
      this.bibleService.curBible.subscribe(bible => {
        this.bible = bible;
        if(this.bible) {
          this.attempts = this._storageService.getAttempts(this.bible.m.t);
        }
      })
    );
  }

  ngOnInit(): void {
    // Optionally auto-open passage selection
  } 

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  openPassageSelect() {
    if(!this.bible) return;
    let last5Attempts = Array.from(this.attempts.values()).sort((a,b) => b.timestamp - a.timestamp).slice(0,5);
    let passages: BiblePassage[] = [];
    for (let attempt of last5Attempts) {
      let passage = this.bible.getPassage(attempt.diff.i, attempt.diff.j);
      if (passage) {
        passages.push(passage);
      }
    }
    const dialogRef = this.dialog.open(PassageSelectDialogComponent, {
      data: {
        title: 'Select a Passage',
        subtitle: 'Please select a passage from the Bible.',
        options: passages,
      },
    });
    dialogRef.afterClosed().subscribe((result: BiblePassage | undefined) => {
      if (result && this.bible) {
        this.passage = result;
        this.generateBlanks();
      }
    });
  }

  generateBlanks() {
    if (!this.passage || !this.bible) return;
    const text = this.bible.getText(this.passage.i, this.passage.j);
    this.passageText = text.split(/\s+/);
    this.userAnswers = {};
    // Get adaptive blanking percent
    this.blankingPercent = this.practiceService.getBlankingPercentage(this.passage.id);
    // Randomly select blank indices
    const numBlanks = Math.max(1, Math.floor(this.passageText.length * this.blankingPercent));
    const indices = Array.from({ length: this.passageText.length }, (_, i) => i);
    this.blankIndices = new Set();
    while (this.blankIndices.size < numBlanks && indices.length > 0) {
      const idx = Math.floor(Math.random() * indices.length);
      this.blankIndices.add(indices[idx]);
      indices.splice(idx, 1);
    }
    this.feedback = { correct: 0, total: 0, show: false };
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.userAnswers[index] = input.value;
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if ((event.key === 'Tab' || event.key === ' ' || event.key === 'Spacebar') && !event.shiftKey) {
      event.preventDefault();
      // Find the next blank index
      const blankIndicesSorted = Array.from(this.blankIndices).sort((a, b) => a - b);
      const currentIdx = blankIndicesSorted.indexOf(index);
      if (currentIdx !== -1 && currentIdx < blankIndicesSorted.length - 1) {
        const nextIndex = blankIndicesSorted[currentIdx + 1];
        // Focus the next input
        setTimeout(() => {
          const inputArray = this.blankInputs.toArray();
          const nextInput = inputArray[blankIndicesSorted.indexOf(nextIndex)];
          if (nextInput) {
            nextInput.nativeElement.focus();
            nextInput.nativeElement.select();
          }
        });
      } else {
        // Optionally blur or do nothing if at the end
        (event.target as HTMLInputElement).blur();
      }
    }
    if (event.key === 'Enter' && this.allBlanksFilled()) {
      this.submit();
    }
  }

  isBlankCorrect(index: number): boolean {
    const answer = (this.userAnswers[index] || '').trim();
    const actual = this.passageText[index].trim();
    const answerClean = answer.replace(/[^a-zA-Z0-9]/g, '');
    const actualClean = actual.replace(/[^a-zA-Z0-9]/g, '');
    return answerClean.toLowerCase() === actualClean.toLowerCase();
  }

  submit() {
    if (!this.passage || !this.allBlanksFilled() || this.feedback.show) return;
    let correct = 0;
    let total = this.blankIndices.size;
    for (const idx of this.blankIndices) {
      const answer = (this.userAnswers[idx] || '').trim();
      const actual = this.passageText[idx].trim();
      // Remove non-alphanumeric characters 
      const answerClean = answer.replace(/[^a-zA-Z0-9]/g, '');
      const actualClean = actual.replace(/[^a-zA-Z0-9]/g, '');
      if (answerClean.toLowerCase() === actualClean.toLowerCase()) correct++;
    }
    this.feedback = { correct, total, show: true };
    // Save result and adjust blanking
    this.practiceService.saveAttempt(this.passage.id, { correct, total });
    const score = total > 0 ? correct / total : 0;
    this.blankingPercent = this.practiceService.adjustBlankingPercentage(this.passage.id, score);
  }

  retry() {
    this.generateBlanks();
  }

  allBlanksFilled(): boolean {
    if (!this.passageText || !this.blankIndices) return false;
    for (const idx of this.blankIndices) {
      if (!this.userAnswers[idx] || this.userAnswers[idx].trim() === '') {
        return false;
      }
    }
    return true;
  }
} 