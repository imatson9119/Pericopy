import { Component, NgZone } from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';
import { BibleService } from '../services/bible.service';
import { MatDialog } from '@angular/material/dialog';
import { VerseSelectorComponent } from '../verse-selector/verse-selector.component';
import { BiblePassage } from '../classes/BiblePassage';
import { sanitizeText } from '../utils/utils';

declare const annyang: any;

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent {
  attempt = '';
  annyang = annyang;
  recording = false;

  constructor(
    private _storageService: StorageService,
    private _bibleService: BibleService,
    private router: Router,
    private _dialog: MatDialog,
    private ngZone: NgZone
  ) {
    annyang.addCallback('result', (userSaid: string[] | undefined) => {
      if(userSaid && userSaid.length > 0){
        ngZone.run(() => {
          if (this.attempt.length > 0 && this.attempt[this.attempt.length - 1] !== " "){
            this.attempt += ' ';
          }
          this.attempt += userSaid[0].trim();
        });
      }
    });
  }

  submit() {
    let anchors = this._bibleService.bible.anchorText(this.attempt);
    if (!this.canAutoLock(anchors, this.attempt)) {
      this.openVerseSelector(anchors);
    } else {
      this.getAndStoreDiff(anchors[0][0]);
    }
  }

  getAndStoreDiff(passage: BiblePassage) {
    let diff = this._bibleService.getBibleDiff(
      this.attempt,
      passage.i,
      passage.j + 1
    );
    if (!diff) {
      throw new Error('Error getting diff');
    }
    this._storageService.storeAttempt(diff);
    this.router.navigateByUrl('results');
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

  openVerseSelector(anchorList: [BiblePassage, number][]) {
    this._dialog.open(VerseSelectorComponent, {
      data: { anchors: anchorList, attempt: this.attempt },
    });
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.submit();
    }
  }

  toggleVoice() {
    if (annyang.isListening()) {
      annyang.abort();
      this.recording = false;
    } else {
      annyang.start();
      this.recording = true;
    }
  }
}
