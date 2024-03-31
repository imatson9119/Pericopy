import { Component, Inject, ViewChild } from '@angular/core';
import { BibleService } from '../../services/bible.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BiblePassage } from '../../classes/BiblePassage';
import { abbreviateBookName } from 'src/app/utils/utils';
import { VerseSelectorComponent } from 'src/app/verse-selector/verse-selector.component';

@Component({
  selector: 'app-failed-lock',
  templateUrl: './failed-lock.component.html',
  styleUrls: ['./failed-lock.component.scss'],
})
export class FailedLockComponent {
  nWordsToPreview = 40;
  attemptLength = 0;
  dedupedAnchors: BiblePassage[] = [];
  abbreviateBookName = abbreviateBookName;

  @ViewChild('start') start: VerseSelectorComponent | undefined = undefined;
  @ViewChild('end') end: VerseSelectorComponent | undefined = undefined;

  constructor(
    private _bibleService: BibleService,
    private _dialogRef: MatDialogRef<FailedLockComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.attemptLength = this.data.attempt.split(/\s+/).length;
    this.dedupedAnchors = this.dedupeAnchors(this.data.anchors);
  }

  dedupeAnchors(anchors: [BiblePassage, number][]): BiblePassage[] {
    let deduped: BiblePassage[] = [];
    let seen: Set<string> = new Set();
    for (let anchor of anchors) {
      if (!seen.has(anchor[0].toString())) {
        deduped.push(anchor[0]);
        seen.add(anchor[0].toString());
      }
    }
    return deduped;
  }

  submit() {
    if (this.start && this.end && this.start.finishedSelection && this.end.finishedSelection){
      this._dialogRef.close([this.start.verse.m.i, this.end.verse.m.i + this.end.verse.m.l]);
    }
  }

  getPreview(): string{
    if (this.isValid()) {
      // @ts-ignore
      let startIndex: number = this.start.verse.m.i;
      // @ts-ignore
      let endIndex: number = this.end.verse.m.i + this.end.verse.m.l;
      if (endIndex - startIndex > this.nWordsToPreview) {
        let startText = this._bibleService.bible.getText(
          startIndex,
          Math.min(startIndex + 20, endIndex - 10)
        );
        let endText = this._bibleService.bible.getText(
          Math.max(endIndex - 20, startIndex + 10),
          endIndex
        );
        return startText + ' ... ' + endText;
      }
      return this._bibleService.bible.getText(startIndex, endIndex);
    }
    return "";
  }

  isValid(): boolean {
    return (
      this.start != undefined &&
      this.end != undefined &&
      this.start.finishedSelection &&
      this.end.finishedSelection && 
      this.start.verse.m.i <= this.end.verse.m.i
    );
  }

  selectPassage(passage: BiblePassage) {
    if(this.start && this.end){
      this.start.book = passage.b1;
      this.start.chapter = passage.c1;
      this.start.verse = passage.v1;
      this.end.book = passage.b2;
      this.end.chapter = passage.c2;
      this.end.verse = passage.v2;
      this.start.finishedSelection = true;
      this.end.finishedSelection = true;
    }
  }
}
