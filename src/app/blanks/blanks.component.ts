import { Component, OnInit, QueryList, ViewChildren, ElementRef, Input, ViewChild, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BibleService } from '../services/bible.service';
import { BiblePassage } from '../classes/BiblePassage';
import { Bible } from '../classes/Bible';
import { PassageSelectDialogComponent } from '../misc-components/passage-select-dialog/passage-select-dialog.component';
import { MemorizationPracticeService } from './memorization-practice.service';
import { IResult } from '../classes/models';
import { Subscription, combineLatest } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { Goal } from '../classes/Goal';


enum BlankType {
  EMPTY,
  FILLED,
  CORRECT,
  INCORRECT,
  HINTED
}

interface BlankState {
  index: number;
  blankIndex: number;
  value: string;
  answer: string;
  type: BlankType;
  prev: number | null;
  next: number | null;
}

@Component({
  selector: 'app-blanks',
  templateUrl: './blanks.component.html',
  styleUrls: ['./blanks.component.scss']
})
export class BlanksComponent implements OnInit {
  attempts: Map<string,IResult> = new Map();
  passage: BiblePassage | null = null;
  passageText: string[] = [];
  curFocusedBlankIndex: number | null = null;
  blanks: Map<number, BlankState> = new Map();
  nFilledBlanks: number = 0;
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
  subscriptions: Subscription[] = [];
  @ViewChildren('blankInput') blankInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('retryButton') retryButton!: ElementRef<HTMLButtonElement>;
  public Math = Math; // Expose Math for template
  public Object = Object; // Expose Object for template
  public BlankType = BlankType;
  private textMeasureCanvas: HTMLCanvasElement | null = null;
  private textMeasureContext: CanvasRenderingContext2D | null = null;

  // Goal-specific properties
  goalId: string | null = null;
  goal: Goal | null = null;
  isGoalMode: boolean = false;

  // Query params
  i: number | null = null;
  j: number | null = null;

  // Dynamic width toggle
  dynamicInputWidth: boolean = true;

  constructor(
    private dialog: MatDialog,
    private bibleService: BibleService,
    private practiceService: MemorizationPracticeService,
    private _storageService: StorageService,
    private titleService: Title,
    private metaService: Meta,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Create a joint observable that combines both bible and query params
    this.subscriptions.push(
      combineLatest([
        this.bibleService.curBible,
        this.route.queryParams
      ]).subscribe(([bible, params]) => {
        this.bible = bible;
        this.goalId = params['goalId'] || null;
        this.isGoalMode = !!this.goalId;
        this.i = params['i'] || null;
        this.j = params['j'] || null;
        
        if (this.bible) {
          this.attempts = this._storageService.getAttempts(this.bible.m.t);
        }

        if (this.i && this.j && this.bible) {
          this.setPassage(this.bible.getPassage(this.i, this.j));
        } else if (this.goalId) {
          this.loadGoalContext();
        }
      })
    );
  }

  ngOnInit(): void {
    this.initializeTextMeasurement();
  }

  private setPassage(passage: BiblePassage): void {
    this.passage = passage;
    this.generateBlanks();
    this.updatePageMetadata();
  }

  private loadGoalContext(): void {
    if (!this.goalId || !this.bible) return;
    
    const goal = this._storageService.getGoal(this.goalId);
    if (!goal) {
      this.router.navigate(['/blanks']);
      return;
    }
    
    this.goal = goal;
    this.setPassage(this.bible.getPassage(goal.i, goal.j));
  }

  private updatePageMetadata(): void {
    let pageTitle = 'Fill in the Blanks | Pericopy';
    let pageDescription = 'Practice scripture memorization with our adaptive fill-in-the-blanks exercise. Our intelligent system adjusts difficulty based on your performance to optimize learning.';
    
    if (this.isGoalMode && this.goal) {
      pageTitle = `${this.goal.title} - Fill in the Blanks | Pericopy`;
      pageDescription = `Practice fill-in-the-blanks for your goal: ${this.goal.title}. Track your progress and improve your scripture memorization.`;
    } else if (this.passage) {
      pageTitle = `${this.passage.toString()} - Fill in the Blanks | Pericopy`;
      pageDescription = `Practice fill-in-the-blanks for the passage: ${this.passage.toString()}. Track your progress and improve your scripture memorization.`;
    }

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:url', content: 'https://pericopy.net/blanks' });
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
        this.isGoalMode = false;
        this.goalId = null;
        this.goal = null;
        // set i and j query params to the result
        this.router.navigate([], { queryParams: { i: result.i, j: result.j } });
        this.setPassage(result);
        // Track this passage as recently used
        this.practiceService.trackRecentPassage(result.id, result.i, result.j);
      }
    });
  }

  generateBlanks() {
    if (!this.passage || !this.bible) return;
    const text = this.bible.getText(this.passage.i, this.passage.j);
    this.passageText = text.split(/\s+/);
    this.blanks = new Map();
    this.nFilledBlanks = 0;
    
    // Get adaptive blanking percent and velocity info - use goal-specific methods when in goal mode
    if (this.isGoalMode && this.goalId) {
      this.blankingPercent = this.practiceService.getBlankingPercentageForGoal(this.goalId, this.passage.id);
      this.velocityInfo = this.practiceService.getVelocityInfoForGoal(this.goalId, this.passage.id);
    } else {
      this.blankingPercent = this.practiceService.getBlankingPercentage(this.passage.id);
      this.velocityInfo = this.practiceService.getVelocityInfo(this.passage.id);
    }
    
    // Randomly select blank indices
    const numBlanks = Math.max(1, Math.floor(this.passageText.length * this.blankingPercent));
    const indices = Array.from({ length: this.passageText.length }, (_, i) => i);
    let blankIndices = new Set<number>();
    while (blankIndices.size < numBlanks && indices.length > 0) {
      const idx = Math.floor(Math.random() * indices.length);
      blankIndices.add(indices[idx]);
      indices.splice(idx, 1);
    }
    const blankIndicesSorted = Array.from(blankIndices).sort((a, b) => a - b);
    for (let i = 0; i < blankIndicesSorted.length; i++) {
      const wordIndex = blankIndicesSorted[i];
      this.blanks.set(wordIndex, {
        index: wordIndex,
        blankIndex: i,
        value: '',
        answer: this.passageText[wordIndex],
        type: BlankType.EMPTY,
        prev: i > 0 ? blankIndicesSorted[i - 1] : null,
        next: i < blankIndicesSorted.length - 1 ? blankIndicesSorted[i + 1] : null,
      })
    }
    this.feedback = { correct: 0, total: 0, show: false };
    this.difficultyAdjustment = null;
    
    // Auto-focus the first blank input after the view updates
    setTimeout(() => {
      this.focusFirstBlank();
    }, 100);
  }

  toggleInputWidth() {
    this.dynamicInputWidth = !this.dynamicInputWidth;
  }

  revealAnswer() {
    if (this.curFocusedBlankIndex == null) return;
    const blank = this.blanks.get(this.curFocusedBlankIndex);
    if (blank == undefined) return;
    if (blank.type === BlankType.EMPTY) {
      this.nFilledBlanks++;
    }
    blank.type = BlankType.HINTED;
    blank.value = blank.answer;
    const input = this.blankInputs.toArray()[blank.blankIndex].nativeElement;
    input.value = blank.value;
    input.style.width = this.getInputWidth(blank.value, blank.value);
    if (blank.next != null) {
      const nextInput = this.nextBlank(blank);
      if (nextInput == null) return;
      nextInput.focus();
      nextInput.select();
      nextInput.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  private focusFirstBlank() {
    const firstInput = this.blankInputs.first.nativeElement;
    if (firstInput) {
      firstInput.focus();
      firstInput.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  onFocus(index: number) {
    this.curFocusedBlankIndex = index;
  }
  
  nextBlank(blank: BlankState): HTMLInputElement | null {
    const inputs = this.blankInputs.toArray();
    let currentBlank: BlankState | undefined = blank;
    while (currentBlank.next != null) {
      currentBlank = this.blanks.get(currentBlank.next);
      if (currentBlank == undefined) return null;
      if (currentBlank.type === BlankType.EMPTY || currentBlank.type === BlankType.FILLED) {
        return inputs[currentBlank.blankIndex].nativeElement;
      }
    }
    return null;
  }

  prevBlank(blank: BlankState): HTMLInputElement | null {
    const inputs = this.blankInputs.toArray();
    let currentBlank: BlankState | undefined = blank;
    while (currentBlank.prev != null) {
      currentBlank = this.blanks.get(currentBlank.prev);
      if (currentBlank == undefined) return null;
      if (currentBlank.type === BlankType.EMPTY || currentBlank.type === BlankType.FILLED) {
        return inputs[currentBlank.blankIndex].nativeElement;
      }
    }
    return null;
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const blank = this.blanks.get(index);
    blank!.value = input.value;
    if (blank == undefined) return;
    const newWidth = this.getInputWidth(blank.answer, blank.value);
    input.style.width = newWidth;
    if (blank.type !== BlankType.FILLED) {
      blank.type = BlankType.FILLED;
      this.nFilledBlanks++;
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const blank = this.blanks.get(index);
    if ((event.key === 'Tab' || event.key === ' ' || event.key === 'Spacebar') && !event.shiftKey) {
      event.preventDefault();
      if (blank == undefined) return;
      const nextInput = this.nextBlank(blank);
      if (nextInput == null) return;
      nextInput.focus();
      nextInput.select();
      nextInput.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
    
    // Handle backspace on empty input to move to previous blank
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (input.value !== '') return;
      event.preventDefault();
      if (blank == undefined) return;
      const prevInput = this.prevBlank(blank);
      if (prevInput == null) return;
      prevInput.focus();
      prevInput.select();
      prevInput.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
    
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        this.revealAnswer();
      } else {
        this.submit();
      }
    }
  }

  isBlankCorrect(blank: BlankState): boolean {
    if (blank == undefined) return false;
    const answer = (blank.value || '').trim();
    const actual = blank.answer.trim();
    const answerClean = answer.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const actualClean = actual.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return answerClean === actualClean;
  }

  submit() {
    if (!this.passage || this.feedback.show) return;
    let correct = 0;
    let total = this.blanks.size;
    for (let blank of this.blanks.values()) {
      if (this.isBlankCorrect(blank)) {
        if (blank.type === BlankType.FILLED) {
          correct++;
          blank.type = BlankType.CORRECT;
        } 
      } else {
        blank.type = BlankType.INCORRECT;
      }
    }
    this.feedback = { correct, total, show: true };
    
    // Get difficulty adjustment preview before making changes - use goal-specific methods when in goal mode
    const score = total > 0 ? correct / total : 0;
    if (this.isGoalMode && this.goalId) {
      this.difficultyAdjustment = this.practiceService.getDifficultyAdjustmentPreviewForGoal(this.goalId, this.passage.id, score);
      
      // Save result and adjust blanking for goal
      this.practiceService.saveAttemptForGoal(this.goalId, this.passage.id, { correct, total });
      this.blankingPercent = this.practiceService.adjustBlankingPercentageForGoal(this.goalId, this.passage.id, score);
      
      // Update velocity info after adjustment
      this.velocityInfo = this.practiceService.getVelocityInfoForGoal(this.goalId, this.passage.id);
    } else {
      this.difficultyAdjustment = this.practiceService.getDifficultyAdjustmentPreview(this.passage.id, score);
      
      // Save result and adjust blanking for freestyle
      this.practiceService.saveAttempt(this.passage.id, { correct, total });
      this.blankingPercent = this.practiceService.adjustBlankingPercentage(this.passage.id, score);
      
      // Update velocity info after adjustment
      this.velocityInfo = this.practiceService.getVelocityInfo(this.passage.id);
    }
  }

  retry() {
    this.generateBlanks();
  }

  allBlanksFilled(): boolean {
    if (!this.blanks) return false;
    for (let blank of this.blanks.values()) {
      if (blank.type === BlankType.EMPTY) {
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
    // If dynamic width is disabled, return a fixed width
    // Update font to match actual input styling
    this.updateFontFromInput();
    
    // Use the current value if it exists and is longer, otherwise use the target word
    const textToMeasure = (currentValue && currentValue.length > targetWord.length) || !this.dynamicInputWidth ? currentValue : targetWord;
    
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