import { Component, ElementRef, EventEmitter, Input, NgZone, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Bible } from 'src/app/classes/Bible';
import { BiblePassage } from 'src/app/classes/BiblePassage';
import { WordChange, DiffType, AnchorType } from 'src/app/classes/models';
import { sanitizeText, saveCaretPosition, normalizeString, LinkedList, Node } from 'src/app/utils/utils';
import { DynamicSpanComponent } from '../dynamic-span/dynamic-span.component';

declare const annyang: any;

// Declare state enum
enum InputState {
  NONE,
  WAITING,
  NO_LOCK,
  CORRECT,
  ERRORS
}

enum SpanClass {
  ADDED = 'added',
  REMOVED = 'removed',
  UNCHANGED = 'unchanged',
  CHANGED = 'changed'
}

class DynamicSpan {
  startIndex: number = -1;
  endIndex: number = -1;
  displayText: string = '';
  tooltipText: string = '';
  class: string = '';
}

@Component({
  selector: 'app-practice-input-div',
  standalone: true,
  imports: [],
  templateUrl: './practice-input-div.component.html',
  styleUrl: './practice-input-div.component.scss'
})
export class PracticeInputDivComponent {
  attempt = '';
  detectPassage = true;
  _passage: BiblePassage | undefined = undefined;
  subscriptions: Subscription[] = [];
  keyPressTimeout: any;
  InputState = InputState
  _inputState = InputState.NO_LOCK;
  STORAGE_KEY = 'practice-text';
  history: LinkedList<string> = new LinkedList<string>();
  redoStack: string[] = [];

  @ViewChild('input') input: ElementRef | null = null;
  @ViewChild('input', { read: ViewContainerRef }) inputContainerRef: ViewContainerRef | null = null;
  @Input() bible: Bible | undefined;
  @Output() onPassageChange: any = new EventEmitter<BiblePassage | undefined>(true);
  @Output() onInputStateChange: any = new EventEmitter<InputState>();

  constructor(
    private ngZone: NgZone
  ) {
  }

  ngAfterViewInit(): void {
    this.loadFromLocalStorage();
    this.processDiff();
    this.moveCaretToEnd();
    this.addToHistory();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['bible']) {
      this.processDiff();
    }
  }

  set inputState(state: InputState) {
    this._inputState = state;
    this.onInputStateChange.emit(state);
  }

  get inputState() {
    return this._inputState;
  }

  set passage(passage: BiblePassage | undefined) {
    this._passage = passage;
    this.onPassageChange.emit(passage);
  }

  get passage() {
    return this._passage;
  }

  // canAutoLock(anchorList: [BiblePassage, number][], attempt: string) {
  //   if (anchorList.length === 0) {
  //     return false;
  //   }
  //   let topAnchor = anchorList[0][0];
  //   return (
  //     anchorList[0][1] === 1 &&
  //     topAnchor.j - topAnchor.i < sanitizeText(attempt).split(/\s+/).length * 2
  //   );
  // }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Enter') {
      e.preventDefault();
      if ((e.ctrlKey || e.metaKey || e.shiftKey) && this.passage) {
        this.fixErrors();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { // Undo 
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      e.preventDefault();
    } else if (e.code === 'Tab') {
      e.preventDefault();
      if (this.passage) {
        this.nextWord();
      }
    }
  }

  onChange(e: any) {
    if (this.redoStack.length > 0) {
      this.redoStack = [];
    }
    this.attempt = this.input!.nativeElement.textContent;
    this.saveToLocalStorage();
    if (this.keyPressTimeout) {
      clearTimeout(this.keyPressTimeout);
    }
    this.inputState = InputState.WAITING;
    if (e.data === ' ') {
      this.processDiff();
      this.addToHistory();
    } else {
      this.keyPressTimeout = setTimeout(() => {
        this.processDiff();
        this.addToHistory();
      }, 3000); // 3000 milliseconds = 3 seconds
    }
  }

  toggleVoice() {
    if (annyang.isListening()) {
      annyang.abort();
    } else {
      annyang.start();
    }
  }

  undo() {
    const restorePosition = saveCaretPosition(this.input!.nativeElement);
    if (this.history.length === 0) {
      return;
    } 
    let old = this.history.removeBack();
    this.redoStack.push(this.attempt);
    while (this.history.length > 0 && old === this.attempt) {
      this.redoStack.push(old);
      old = this.history.removeBack();
    }
    this.setAttempt(old);
    this.processDiff();
    // try catch block to prevent error when the input is empty
    try {
      restorePosition();
    } catch (e) {
      this.moveCaretToEnd();
    }
  }

  redo() {
    const restorePosition = saveCaretPosition(this.input!.nativeElement);
    if (this.redoStack.length === 0) {
      return;
    }
    this.history.addBack(this.attempt);
    this.setAttempt(this.redoStack.pop()!);
    this.processDiff();
    // try catch block to prevent error when the input is empty
    try {
      restorePosition();
    } catch (e) {
      this.moveCaretToEnd();
    }
  }


  addToHistory() {
    this.history.addBack(this.attempt);
    if (this.history.length > 100) {
      this.history.removeFront();
    }
  }
  
  // Need an async routine to get the Bible diff and update the UI with the results
  async processDiff() {
    if (this.keyPressTimeout) {
      clearTimeout(this.keyPressTimeout);
    }

    if (!this.bible) {
      this.inputState = InputState.NONE;
      return;
    }
    const wordsArr = sanitizeText(this.attempt.trim()).split(/\s+/);
    const startAnchors = this.bible._getBibleAnchors(wordsArr, AnchorType.START, 1, 0, Number.POSITIVE_INFINITY);
    if (startAnchors.length === 0 || startAnchors[0][1] < 1) {
      this.inputState = InputState.NO_LOCK;
      return;
    }
    const startAnchor = startAnchors[0][0];
    const endAnchors = this.bible._getBibleAnchors(wordsArr, AnchorType.END, 1, startAnchor, startAnchor + wordsArr.length * 2);
    if (endAnchors.length === 0 || endAnchors[0][1] < 1) {
      this.inputState = InputState.NO_LOCK;
      return;
    } 
    const endAnchor = endAnchors[0][0];

    this.passage = this.bible.getPassage(startAnchor, endAnchor + 1)
    let diff: WordChange[] | undefined = this.bible.getFlatDiff(this.attempt, this.passage.i, this.passage.j, true);
    if (!diff) {
      this.inputState = InputState.NONE;
      throw new Error('Error getting diff');
    }
    this.updateUIWithDiff(diff);
    if (diff.length === 1 && diff[0].t === DiffType.UNCHANGED) {
      this.inputState = InputState.CORRECT;
    } else {
      this.inputState = InputState.ERRORS;
    }
  }

  updateUIWithDiff(diff: WordChange[]) {
    /*
    Using the diff, this function will first normalize the attempt, and for each diff (set of words)
    in the diff, it will normalize the diff, find the corresponding substring in the normalized attempt,
    create a span element with the appropriate class, and append it to the input element.
    */
    if (!this.input) {
      return; 
    }
    // Save selection position to restore after updating the UI
    const restorePosition = saveCaretPosition(this.input!.nativeElement);
    this.input!.nativeElement.innerHTML = '';
    let spans = this.getSpans(diff, this.attempt);
    for (let span of spans) {
      this.addSpanToInput(span.displayText, span.class, span.tooltipText);
    }

    restorePosition();
  }

  getSpans(diff: WordChange[], attempt: string) {
    /* Converts the diff into a list of spans to display in the input element 
       This is done by building a list of spans, combining diffs when possible.
       For example, added and removed will be combined into a single span, and consecutive
       changed or added spans will be combined into a single span when possible. */
    const [normalizedText, normalizedTextMapping] = normalizeString(attempt);
    let spans: DynamicSpan[] = [];
    let curSpan: DynamicSpan | null = null;
    let curIndex = 0;
    let originalStart = 0;
    let originalEnd = 0;
    for (let i = 0; i < diff.length; i++) {
      const change = diff[i];
      const [normalizedDiff, normalizedDiffMapping] = normalizeString(change.v.join(''));
      originalStart = normalizedTextMapping[curIndex];
      originalEnd = normalizedTextMapping[curIndex];
      let text = '';
      if (change.t != DiffType.REMOVED) {
        originalStart = normalizedTextMapping[curIndex];
        originalEnd = curIndex + normalizedDiff.length < normalizedTextMapping.length 
          ? normalizedTextMapping[curIndex + normalizedDiff.length ]
          : normalizedTextMapping[normalizedText.length - 1] + 1;
        curIndex += normalizedDiff.length;
        text = attempt.substring(originalStart, originalEnd);
      }

      switch (change.t) {
        case DiffType.ADDED:
          if (!curSpan || curSpan.class === SpanClass.UNCHANGED) {
            curSpan = new DynamicSpan();
            curSpan.startIndex = originalStart;
            curSpan.endIndex = originalEnd;
            curSpan.displayText = text;
            curSpan.tooltipText = '';
            curSpan.class = SpanClass.ADDED;
          } else {
            curSpan.endIndex = originalEnd;
            curSpan.displayText += text;
            if (curSpan.class === SpanClass.REMOVED) {
              curSpan.class = SpanClass.CHANGED;
            }
          }
          break;
        case DiffType.REMOVED:
          if (!curSpan || curSpan.class === SpanClass.UNCHANGED) {
            curSpan = new DynamicSpan();
            curSpan.startIndex = originalStart;
            curSpan.endIndex = originalEnd;
            curSpan.displayText = text;
            curSpan.tooltipText = change.v.join(' ');
            curSpan.class = SpanClass.REMOVED;
          } else {
            curSpan.endIndex = originalEnd;
            curSpan.displayText += text;
            curSpan.tooltipText += " " + change.v.join(' ');
            if (curSpan.class === SpanClass.ADDED) {
              curSpan.class = SpanClass.CHANGED;
            }
          }
          break;
        case DiffType.UNCHANGED:
          if (curSpan) {
            if (curSpan.class === SpanClass.REMOVED && spans.length > 0) {
              // We need to adjust the span to include the whitespace ending the previous span
              const prevSpan = spans[spans.length - 1];
              const match = prevSpan.displayText.match(/\s+$/);
              if (match) {
                const whitespace = match[0];
                const whitespaceIndex = prevSpan.displayText.length - whitespace.length;
                curSpan.displayText = prevSpan.displayText.substring(whitespaceIndex);
                curSpan.startIndex -= whitespace.length;
                prevSpan.displayText = prevSpan.displayText.substring(0, whitespaceIndex);
                prevSpan.endIndex -= whitespace.length;
              }
            }
            spans.push(curSpan);
            curSpan = null;
          }
          spans.push({
            startIndex: originalStart,
            endIndex: originalEnd,
            displayText: text,
            tooltipText: '',
            class: SpanClass.UNCHANGED
          });
          break;
      }
    }
    if (curSpan) {
      spans.push(curSpan);
    }
    if (originalEnd < attempt.length) {
      spans.push({
        startIndex: originalEnd,
        endIndex: attempt.length,
        displayText: attempt.substring(originalEnd),
        tooltipText: '',
        class: SpanClass.UNCHANGED
      });
    }
    return spans;
  }
  
  handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    let text = e.clipboardData?.getData('text');
    if (!text) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(document.createTextNode(text));
    selection.collapseToEnd();
    this.attempt = this.input!.nativeElement.textContent;
    this.saveToLocalStorage();
    this.processDiff();
    this.addToHistory();
  }

  moveCaretToEnd() {
    const range = document.createRange();
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    range.selectNodeContents(this.input!.nativeElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  fixErrors() {
    if (!this.passage) {
      return;
    }
    const text = this.bible!.getText(this.passage.i, this.passage.j);
    this.input!.nativeElement.innerHTML = text;
    this.attempt = text;
    this.processDiff();
  }

  nextWord() {
    if (!this.passage) {
      return;
    }
    let nextIndex = this.passage.j;
    if (this.attempt.length > 0 && this.attempt[this.attempt.length - 1] !== ' ') {
      this.attempt += ' ';
    }
    const text = this.bible!.getText(nextIndex, nextIndex + 1);
    this.addToAttempt(text + " ");
    this.moveCaretToEnd();
  }

  addToAttempt(text: string) {
    this.attempt += text;
    this.addSpanToInput(text);
    this.processDiff()
  }

  setAttempt(text: string) {
    this.attempt = text;
    this.input!.nativeElement.innerHTML = text;
    this.saveToLocalStorage();
    this.processDiff();
  }

  addSpanToInput(text: string, className: string = '', tooltip: string = '') {
    const componentRef = this.inputContainerRef!.createComponent(DynamicSpanComponent);
    componentRef.setInput("displayText", text);
    componentRef.setInput("tooltipText", tooltip);
    componentRef.setInput("class", className)
    componentRef.changeDetectorRef.detectChanges();
    const elementRef = componentRef.location.nativeElement;
    this.input?.nativeElement.appendChild(elementRef);
  }

  saveToLocalStorage() {
    localStorage.setItem(this.STORAGE_KEY, this.attempt);
  }

  loadFromLocalStorage() {
    const text = localStorage.getItem(this.STORAGE_KEY);
    if (text) {
      this.setAttempt(text);
    }
  }
}
