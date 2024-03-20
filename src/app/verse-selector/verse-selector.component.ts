import { Component, Inject } from '@angular/core';
import { BibleService } from '../services/bible.service';
import { Book, Chapter } from '../classes/models';
import { NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BiblePassage } from '../classes/BiblePassage';
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verse-selector',
  templateUrl: './verse-selector.component.html',
  styleUrls: ['./verse-selector.component.scss'],
})
export class VerseSelectorComponent {
  model: any = {};
  nWordsToPreview = 40;
  attemptLength = 0;
  dedupedAnchors: BiblePassage[] = [];

  constructor(
    private _bibleService: BibleService,
    private _storageService: StorageService,
    private _router: Router,
    private _dialogRef: MatDialogRef<VerseSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.attemptLength = this.data.attempt.split(/\s+/).length;
    this.dedupedAnchors = this.dedupeAnchors(this.data.anchors);
  }

  getBooks(): Book[] {
    return this._bibleService.bible.v;
  }

  getChapters(book: Book): Chapter[] {
    return book.v;
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
    console.log('here')
    let diff = this._bibleService.getBibleDiff(this.data.attempt, this.model.v1.m.i, this.model.v2.m.i + this.model.v2.m.l)
    if (!diff){
      throw new Error("Error getting diff")
    }
    this._storageService.storeAttempt(diff);
    this._dialogRef.close();
    this._router.navigateByUrl('results');
  }

  getPreview() {
    if (
      this.model.b1 &&
      this.model.c1 &&
      this.model.v1 &&
      this.model.b2 &&
      this.model.c2 &&
      this.model.v2
    ) {
      if (this.model.v1.m.i > this.model.v2.m.i) {
        return null;
      }
      let startIndex = this.model.v1.m.i;
      let endIndex = this.model.v2.m.i + this.model.v2.m.l;
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
    return null;
  }

  isValid(): boolean {
    return (
      this.model.b1 &&
      this.model.c1 &&
      this.model.v1 &&
      this.model.b2 &&
      this.model.c2 &&
      this.model.v2 &&
      this.model.v1.m.i <= this.model.v2.m.i
    );
  }

  selectPassage(passage: BiblePassage) {
    this.model.b1 = passage.b1;
    this.model.c1 = passage.c1;
    this.model.v1 = passage.v1;
    this.model.b2 = passage.b2;
    this.model.c2 = passage.c2;
    this.model.v2 = passage.v2;
  }
}
