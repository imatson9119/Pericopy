import {
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
    standalone: false
})
export class FreestyleComponent
  implements OnDestroy, OnInit
{
  attempt = '';
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
    this.subscriptions.push(
      this._bibleService.curBible.subscribe((bible) => {
        this.bible = bible;
      })
    ); 
  }

  ngOnInit(): void {
    const pageTitle = 'Freestyle Scripture Practice | Pericopy';
    const pageDescription = 'Practice reciting scripture with real-time error detection and intelligent feedback. Start typing any passage and our system will automatically identify what you\'re working on and guide your memorization.';

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:url', content: 'https://pericopy.net/freestyle' });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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