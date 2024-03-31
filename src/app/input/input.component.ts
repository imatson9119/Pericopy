import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';
import { BibleService } from '../services/bible.service';
import { MatDialog } from '@angular/material/dialog';
import { VerseSelectorComponent } from './verse-selector/verse-selector.component';
import { BiblePassage } from '../classes/BiblePassage';
import { sanitizeText } from '../utils/utils';
import { BibleDiff, DiffType } from '../classes/models';
import { v4 as uuidv4 } from 'uuid';

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
  
  @ViewChild('input') input: ElementRef | null = null;
  @ViewChild('inputParent') inputParent: ElementRef | null = null;


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
        this.adjustInputHeight();
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
  }

  submit() {
    if(this.attempt.length === 0){
      return;
    }
    this.annyang.abort();
    let anchors = this._bibleService.bible.anchorText(this.attempt);
    if (!this.canAutoLock(anchors, this.attempt)) {
      this._dialog.open(VerseSelectorComponent, {
        data: { anchors: anchors, attempt: this.attempt },
      }).afterClosed().subscribe((result: [number, number]) => {
        if (result) {
          this.getAndStoreDiff(this._bibleService.bible.getPassage(result[0], result[1]));
        }
      });
    } else {
      this.getAndStoreDiff(anchors[0][0]);
    }
  }

  getAndStoreDiff(passage: BiblePassage) {
    let diff = this._bibleService.getBibleDiff(
      this.attempt,
      passage.i,
      passage.j
    );
    if (!diff) {
      throw new Error('Error getting diff');
    }
    let id = this.processDiff(diff);
    this.router.navigate(['/results'], { queryParams: { id: id } }); 
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

  adjustInputHeight(){
    if(this.input && this.inputParent){
      let prevParentMinHeight = this.inputParent.nativeElement.style.minHeight;
      this.inputParent.nativeElement.style.minHeight = this.inputParent.nativeElement.offsetHeight + 'px';
      this.input.nativeElement.classList.add('measure-element');
      let height = this.input.nativeElement.scrollHeight;
      this.input.nativeElement.style.height = height + 'px';
      this.input.nativeElement.classList.remove('measure-element');
      this.inputParent.nativeElement.style.minHeight = prevParentMinHeight;
    }
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
    } else {
      annyang.start();
    }
  }

  processDiff(diff: BibleDiff): string {
    // Will want to make heatmap changes here as well
    let totalCorrect = 0;
    let totalWords = 0;
    let timestamp = Date.now();
    for(let book of diff.v){
      for(let chapter of book.v){
        for(let verse of chapter.v){
          for(let change of verse.v){
            if (change.t === DiffType.Unchanged){
              totalCorrect += change.v.length;
            } 
            totalWords += change.v.length;
          }
        }
      }
    }
    let score = totalCorrect / totalWords;
    let id = uuidv4();

    this._storageService.storeAttempt({
      "id": id,
      "diff": diff,
      "timestamp": timestamp,
      "score": score
    });

    return id;
  }
}
