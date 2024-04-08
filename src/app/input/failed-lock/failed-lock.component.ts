import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { BibleService } from '../../services/bible.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BiblePassage } from '../../classes/BiblePassage';
import { abbreviateBookName } from 'src/app/utils/utils';
import { VerseSelectorComponent } from 'src/app/verse-selector/verse-selector.component';
import { Bible } from 'src/app/classes/Bible';
import { Subscription } from 'rxjs';
import { BiblePointer } from 'src/app/classes/models';

@Component({
  selector: 'app-failed-lock',
  templateUrl: './failed-lock.component.html',
  styleUrls: ['./failed-lock.component.scss'],
})
export class FailedLockComponent implements OnDestroy {
  nWordsToPreview = 40;
  attemptLength = 0;
  dedupedAnchors: BiblePassage[] = [];
  abbreviateBookName = abbreviateBookName;
  startRef: BiblePointer | undefined = undefined;
  endRef: BiblePointer | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];

  @ViewChild('start') start: VerseSelectorComponent | undefined = undefined;
  @ViewChild('end') end: VerseSelectorComponent | undefined = undefined;

  constructor(
    private _bibleService: BibleService,
    private _dialogRef: MatDialogRef<FailedLockComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.attemptLength = this.data.attempt.split(/\s+/).length;
    this.dedupedAnchors = this.dedupeAnchors(this.data.anchors);
    this.subscriptions.push(this._bibleService.curBible.subscribe(
      (bible) => {
        this.bible = bible;
      }
    ));
  }

  ngOnDestroy(): void {
      this.subscriptions.forEach(sub => sub.unsubscribe());
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
    if (this.startRef && this.endRef && this.isValid()){
      this._dialogRef.close([this.startRef.verse.m.i, this.endRef.verse.m.i + this.endRef.verse.m.l]);
    }
  }

  getPreview(): string{
    if (this.isValid() && this.bible) {
      // @ts-ignore
      let startIndex: number = this.start.verse.m.i;
      // @ts-ignore
      let endIndex: number = this.end.verse.m.i + this.end.verse.m.l;
      if (endIndex - startIndex > this.nWordsToPreview) {
        let startText = this.bible.getText(
          startIndex,
          Math.min(startIndex + 20, endIndex - 10)
        );
        let endText = this.bible.getText(
          Math.max(endIndex - 20, startIndex + 10),
          endIndex
        );
        return startText + ' ... ' + endText;
      }
      return this.bible.getText(startIndex, endIndex);
    }
    return "";
  }

  isValid(): boolean {
    return (
      this.startRef !== undefined && this.endRef !== undefined &&
      this.startRef.verse.m.i <= this.endRef.verse.m.i
    );
  }

  selectPassage(passage: BiblePassage) {
    this.startRef = {
      book: passage.b1,
      chapter: passage.c1,
      verse: passage.v1,
      index: 0
    };
    this.endRef = {
      book: passage.b2,
      chapter: passage.c2,
      verse: passage.v2,
      index: 0
    };
  }
}
