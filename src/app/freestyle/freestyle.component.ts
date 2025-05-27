import {
  AfterViewInit,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { BibleService } from '../services/bible.service';
import { Title, Meta } from '@angular/platform-browser';
import { BiblePassage } from '../classes/BiblePassage';
import { Bible } from '../classes/Bible';
import { Subscription } from 'rxjs';
import { FreestyleInputDivComponent } from './freestyle-input-div/freestyle-input-div.component';

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
  selector: 'app-freestyle',
  templateUrl: './freestyle.component.html',
  styleUrls: ['./freestyle.component.scss'],
})
export class FreestyleComponent
  implements OnDestroy, OnInit
{
  attempt = '';
  annyang = annyang;
  recording = false;
  passage: BiblePassage | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  InputState = InputState
  inputState = InputState.NO_LOCK;

  @ViewChild('input') input: FreestyleInputDivComponent | null = null;

  constructor(
    private _bibleService: BibleService,
    private ngZone: NgZone,
    private titleService: Title,
    private metaService: Meta
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

  ngOnInit(): void {
    const pageTitle = 'Freestyle Scripture Practice | Pericopy';
    const pageDescription = 'Practice reciting scripture freestyle with real-time error detection and intelligent feedback. Start typing any passage and our system will automatically identify what you\'re working on and guide your memorization.';

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:url', content: 'https://pericopy.net/freestyle' });
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