import { Component, Inject, ViewChild } from '@angular/core';
import { BibleService } from '../../services/bible.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BiblePassage } from '../../classes/BiblePassage';
import { abbreviateBookName } from 'src/app/utils/utils';
import { PassageSelectorComponent } from '../passage-selector/passage-selector.component';

@Component({
  selector: 'app-verse-selector',
  templateUrl: './verse-selector.component.html',
  styleUrls: ['./verse-selector.component.scss'],
})
export class VerseSelectorComponent {
  nWordsToPreview = 40;
  attemptLength = 0;
  dedupedAnchors: BiblePassage[] = [];
  abbreviateBookName = abbreviateBookName;

  @ViewChild('start') start: PassageSelectorComponent | undefined = undefined;
  @ViewChild('end') end: PassageSelectorComponent | undefined = undefined;

  constructor(
    private _bibleService: BibleService,
    private _dialogRef: MatDialogRef<VerseSelectorComponent>,
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
    if (this.start && this.end && this.start.isValid() && this.end.isValid()){
      this._dialogRef.close([this.start.v.m.i, this.end.v.m.i + this.end.v.m.l]);
    }
  }

  getPreview(): string{
    if (this.isValid()) {
      // @ts-ignore
      let startIndex: number = this.start?.v.m.i;
      // @ts-ignore
      let endIndex: number = this.end?.v.m.i + this.end?.v.m.l;
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
      this.start.isValid() &&
      this.end.isValid() && 
      this.start.v.m.i <= this.end.v.m.i
    );
  }

  selectPassage(passage: BiblePassage) {
    if(this.start && this.end){
      this.start.reset();
      this.end.reset();
      this.start.b = passage.b1;
      this.start.c = passage.c1;
      this.start.v = passage.v1;
      this.end.b = passage.b2;
      this.end.c = passage.c2;
      this.end.v = passage.v2;
    }
  }
}
