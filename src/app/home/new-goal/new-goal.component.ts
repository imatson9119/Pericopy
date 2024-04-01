import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BiblePassage } from 'src/app/classes/BiblePassage';
import { FailedLockComponent } from 'src/app/input/failed-lock/failed-lock.component';
import { BibleService } from 'src/app/services/bible.service';
import { abbreviateBookName } from 'src/app/utils/utils';
import { VerseSelectorComponent } from 'src/app/verse-selector/verse-selector.component';

@Component({
  selector: 'app-new-goal',
  templateUrl: './new-goal.component.html',
  styleUrls: ['./new-goal.component.scss']
})
export class NewGoalComponent {
  nWordsToPreview = 40;
  attemptLength = 0;
  dedupedAnchors: BiblePassage[] = [];
  abbreviateBookName = abbreviateBookName;

  @ViewChild('start') start: VerseSelectorComponent | undefined = undefined;
  @ViewChild('end') end: VerseSelectorComponent | undefined = undefined;

  constructor(
    private _bibleService: BibleService,
    private _dialogRef: MatDialogRef<FailedLockComponent>,
  ) {
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
}