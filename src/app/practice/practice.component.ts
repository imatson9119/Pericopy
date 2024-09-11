import {
  AfterViewInit,
  Component,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { BibleService } from '../services/bible.service';
import { BiblePassage } from '../classes/BiblePassage';
import { Bible } from '../classes/Bible';
import { Subscription } from 'rxjs';
import { PracticeInputDivComponent } from './practice-input-div/practice-input-div.component';

declare const annyang: any;

// Declare state enum
enum InputState {
  NONE,
  WAITING,
  NO_LOCK,
  CORRECT,
  ERRORS
}

@Component({
  selector: 'app-practice',
  templateUrl: './practice.component.html',
  styleUrls: ['./practice.component.scss'],
})
export class PracticeComponent
  implements OnDestroy
{
  attempt = '';
  annyang = annyang;
  recording = false;
  passage: BiblePassage | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  InputState = InputState
  inputState = InputState.NO_LOCK;

  @ViewChild('input') input: PracticeInputDivComponent | null = null;

  constructor(
    private _bibleService: BibleService,
    private ngZone: NgZone
  ) {
    annyang.addCallback('result', (userSaid: string[] | undefined) => {
      if (userSaid && userSaid.length > 0) {
        ngZone.run(() => {
          let result = ""
          if (
            this.input!.attempt.length > 0 &&
            this.input!.attempt[this.attempt.length - 1] !== ' '
          ) {
            result += ' ';
          }
          result += userSaid[0].trim();
          this.input!.addToAttempt(result);
        });
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
    this.subscriptions.push(
      this._bibleService.curBible.subscribe((bible) => {
        this.bible = bible;
      })
    ); 
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  
  toggleVoice() {
    if (annyang.isListening()) {
      annyang.abort();
    } else {
      annyang.start();
    }
  } 

  nextWord() {
    if (!this.input) {
      return;
    }
    this.input.nextWord();
  }

  fixErrors() {
    if (!this.input) {
      return;
    }
    this.input.fixErrors();
  }
}