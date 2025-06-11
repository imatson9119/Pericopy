import {
  Component,
  inject,
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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


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
    imports: [FreestyleInputDivComponent, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule]
})
export class FreestyleComponent
  implements OnDestroy, OnInit
{
  private _bibleService = inject(BibleService);
  private ngZone = inject(NgZone);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  attempt = '';
  passage: BiblePassage | undefined = undefined;
  bible = this._bibleService.bible;
  subscriptions: Subscription[] = [];
  InputState = InputState
  inputState = InputState.NO_LOCK;

  @ViewChild('input') input: FreestyleInputDivComponent | null = null;

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