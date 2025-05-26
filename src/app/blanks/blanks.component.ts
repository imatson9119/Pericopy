import { Component, OnInit, QueryList, ViewChildren, ElementRef, Input, ViewChild, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title, Meta } from '@angular/platform-browser';
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
  blankIndicesSorted: number[] = []; // Pre-sorted array for efficient navigation
  blankIndexMap: Map<number, number> = new Map(); // Maps blank index to position in sorted array
  userAnswers: { [index: number]: string } = {};
  blankingPercent: number = 0.2;
  feedback: { correct: number; total: number; show: boolean } = { correct: 0, total: 0, show: false };
  velocityInfo: { successVelocity: number; failureVelocity: number; lastResult: string | null } = { successVelocity: 1, failureVelocity: 1, lastResult: null };
  difficultyAdjustment: { 
    currentDifficulty: number; 
    newDifficulty: number; 
    adjustment: number; 
    velocity: number; 
    adjustmentType: 'increase' | 'decrease' | 'maintain' 
  } | null = null;
  bible: Bible | undefined;
  loading: boolean = false;
  subscriptions: Subscription[] = [];
  @ViewChildren('blankInput') blankInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('retryButton') retryButton!: ElementRef<HTMLButtonElement>;
  public Math = Math; // Expose Math for template
  public Object = Object; // Expose Object for template
  private textMeasureCanvas: HTMLCanvasElement | null = null;
  private textMeasureContext: CanvasRenderingContext2D | null = null;

  // Inputs to allow for passing in a passage


  constructor(
    private dialog: MatDialog,
    private bibleService: BibleService,
    private practiceService: MemorizationPracticeService,
    private _storageService: StorageService,
    private titleService: Title,
    private metaService: Meta
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
    const pageTitle = 'Fill in the Blanks | Pericopy';
    const pageDescription = 'Practice scripture memorization with our adaptive fill-in-the-blanks exercise. Our intelligent system adjusts difficulty based on your performance to optimize learning.';

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:url', content: 'https://pericopy.net/blanks' });

    // Initialize text measurement canvas
    this.initializeTextMeasurement();
    // Optionally auto-open passage selection
  } 

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  openPassageSelect() {
    if(!this.bible) return;
    
    // Get recent passages from the practice service instead of general attempts
    const recentPassages = this.practiceService.getRecentPassages();
    let passages: BiblePassage[] = [];
    
    // Convert recent passages to BiblePassage objects
    for (let recentPassage of recentPassages) {
      let passage = this.bible.getPassage(recentPassage.i, recentPassage.j);
      if (passage) {
        passages.push(passage);
      }
    }
    
    // If we don't have enough recent passages, fall back to general attempts for additional options
    if (passages.length < 5 && this.attempts.size > 0) {
      let last5Attempts = Array.from(this.attempts.values()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 5 - passages.length);
      for (let attempt of last5Attempts) {
        let passage = this.bible.getPassage(attempt.diff.i, attempt.diff.j);
        if (passage && !passages.some(p => p.id === passage.id)) {
          passages.push(passage);
        }
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
        // Track this passage as recently used
        this.practiceService.trackRecentPassage(result.id, result.i, result.j);
        this.generateBlanks();
      }
    });
  }

  generateBlanks() {
    if (!this.passage || !this.bible) return;
    const text = this.bible.getText(this.passage.i, this.passage.j);
    this.passageText = text.split(/\s+/);
    this.userAnswers = {};
    // Get adaptive blanking percent and velocity info
    this.blankingPercent = this.practiceService.getBlankingPercentage(this.passage.id);
    this.velocityInfo = this.practiceService.getVelocityInfo(this.passage.id);
    // Randomly select blank indices
    const numBlanks = Math.max(1, Math.floor(this.passageText.length * this.blankingPercent));
    const indices = Array.from({ length: this.passageText.length }, (_, i) => i);
    this.blankIndices = new Set();
    while (this.blankIndices.size < numBlanks && indices.length > 0) {
      const idx = Math.floor(Math.random() * indices.length);
      this.blankIndices.add(indices[idx]);
      indices.splice(idx, 1);
    }
    this.blankIndicesSorted = Array.from(this.blankIndices).sort((a, b) => a - b);
    this.blankIndexMap = new Map();
    this.blankIndicesSorted.forEach((blankIndex, position) => {
      this.blankIndexMap.set(blankIndex, position);
    });
    this.feedback = { correct: 0, total: 0, show: false };
    this.difficultyAdjustment = null;
    
    // Auto-focus the first blank input after the view updates
    setTimeout(() => {
      this.focusFirstBlank();
    }, 100);
  }

  private focusFirstBlank() {
    if (this.blankIndicesSorted.length > 0 && this.blankInputs) {
      const firstBlankIndex = this.blankIndicesSorted[0];
      const firstInputPosition = this.blankIndexMap.get(firstBlankIndex);
      if (firstInputPosition !== undefined) {
        const inputArray = this.blankInputs.toArray();
        const firstInput = inputArray[firstInputPosition];
        if (firstInput) {
          firstInput.nativeElement.focus();
          firstInput.nativeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.userAnswers[index] = input.value;
    
    // Update input width based on current content
    const targetWord = this.passageText[index];
    const newWidth = this.getInputWidth(targetWord, input.value);
    input.style.width = newWidth;
    
    // Scroll the input into view when focused/clicked
    setTimeout(() => {
      input.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, 100);
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if ((event.key === 'Tab' || event.key === ' ' || event.key === 'Spacebar') && !event.shiftKey) {
      event.preventDefault();
      // Find the next blank index
      const currentIdx = this.blankIndexMap.get(index);
      if (currentIdx !== undefined && currentIdx < this.blankIndicesSorted.length - 1) {
        const nextIndex = this.blankIndicesSorted[currentIdx + 1];
        // Focus the next input
        setTimeout(() => {
          const inputArray = this.blankInputs.toArray();
          const nextInputIdx = this.blankIndexMap.get(nextIndex);
          if (nextInputIdx !== undefined) {
            const nextInput = inputArray[nextInputIdx];
            if (nextInput) {
              nextInput.nativeElement.focus();
              nextInput.nativeElement.select();
              // Scroll the input into view and center it
              nextInput.nativeElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
            }
          }
        });
      } else {
        // Optionally blur or do nothing if at the end
        (event.target as HTMLInputElement).blur();
      }
    }
    
    // Handle backspace on empty input to move to previous blank
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (input.value === '' || input.value.trim() === '') {
        event.preventDefault();
        // Find the previous blank index
        const currentIdx = this.blankIndexMap.get(index);
        if (currentIdx !== undefined && currentIdx > 0) {
          const prevIndex = this.blankIndicesSorted[currentIdx - 1];
          // Focus the previous input
          setTimeout(() => {
            const inputArray = this.blankInputs.toArray();
            const prevInputIdx = this.blankIndexMap.get(prevIndex);
            if (prevInputIdx !== undefined) {
              const prevInput = inputArray[prevInputIdx];
              if (prevInput) {
                prevInput.nativeElement.focus();
                prevInput.nativeElement.select();
                // Scroll the input into view and center it
                prevInput.nativeElement.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center',
                  inline: 'nearest'
                });
              }
            }
          });
        }
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
    
    // Get difficulty adjustment preview before making changes
    const score = total > 0 ? correct / total : 0;
    this.difficultyAdjustment = this.practiceService.getDifficultyAdjustmentPreview(this.passage.id, score);
    
    // Save result and adjust blanking
    this.practiceService.saveAttempt(this.passage.id, { correct, total });
    this.blankingPercent = this.practiceService.adjustBlankingPercentage(this.passage.id, score);
    
    // Update velocity info after adjustment
    this.velocityInfo = this.practiceService.getVelocityInfo(this.passage.id);
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

  getVelocityStatusText(): string {
    if (!this.velocityInfo.lastResult) {
      return 'Starting fresh';
    }
    
    if (this.velocityInfo.lastResult === 'success') {
      const velocity = this.velocityInfo.successVelocity;
      if (velocity === 1) {
        return 'First success';
      } else if (velocity < 2) {
        return 'Building momentum';
      } else if (velocity < 4) {
        return 'Good streak going!';
      } else {
        return 'On fire! 🔥';
      }
    } else {
      const velocity = this.velocityInfo.failureVelocity;
      if (velocity === 1) {
        return 'Learning from mistakes';
      } else if (velocity < 2) {
        return 'Working through challenges';
      } else {
        return 'Adjusting difficulty faster';
      }
    }
  }

  getDifficultyChangeText(): string {
    if (!this.difficultyAdjustment) return '';
    
    const { adjustmentType, velocity, adjustment } = this.difficultyAdjustment;
    const changePercent = Math.round(adjustment * 100);
    
    if (adjustmentType === 'maintain') {
      return 'Difficulty maintained';
    }
    
    const velocityText = velocity > 1 ? ` (${velocity.toFixed(1)}x speed)` : '';
    
    if (adjustmentType === 'increase') {
      return `Difficulty increased by ${changePercent}%${velocityText}`;
    } else {
      return `Difficulty decreased by ${changePercent}%${velocityText}`;
    }
  }

  private initializeTextMeasurement(): void {
    this.textMeasureCanvas = document.createElement('canvas');
    this.textMeasureContext = this.textMeasureCanvas.getContext('2d');
    if (this.textMeasureContext) {
      // Set font to match the input styling - we'll update this when we have actual inputs
      this.textMeasureContext.font = '16px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    }
  }

  private updateFontFromInput(): void {
    if (!this.textMeasureContext) return;
    
    // Try to get font from an actual input element if available
    const inputElement = document.querySelector('.blank-input') as HTMLInputElement;
    if (inputElement) {
      const computedStyle = window.getComputedStyle(inputElement);
      const fontSize = computedStyle.fontSize;
      const fontFamily = computedStyle.fontFamily;
      const fontWeight = computedStyle.fontWeight;
      this.textMeasureContext.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    }
  }

  private measureTextWidth(text: string): number {
    if (!this.textMeasureContext || !text) {
      return 0;
    }
    return this.textMeasureContext.measureText(text).width;
  }

  getInputWidth(targetWord: string, currentValue?: string): string {
    // Update font to match actual input styling
    this.updateFontFromInput();
    
    // Use the current value if it exists and is longer, otherwise use the target word
    const textToMeasure = currentValue && currentValue.length > targetWord.length ? currentValue : targetWord;
    
    // If no text to measure, use a reasonable default
    if (!textToMeasure) {
      return '2rem';
    }
    
    // Measure the actual text width
    const textWidth = this.measureTextWidth(textToMeasure);
    
    // Add padding for the input (0.2rem on each side = 0.4rem total, plus minimal extra space)
    // Convert rem to pixels (assuming 16px = 1rem)
    const paddingWidth = 16; // 1rem total padding (0.5rem each side)
    const extraSpace = 4; // Minimal extra space for comfortable typing
    const minWidth = 32; // Minimum width (2rem)
    
    const calculatedWidth = Math.max(minWidth, textWidth + paddingWidth + extraSpace);
    
    return `${calculatedWidth}px`;
  }
} 