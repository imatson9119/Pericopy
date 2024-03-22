import { Component } from '@angular/core';
import { BiblePassage } from '../classes/BiblePassage';
import { Book, Chapter } from '../classes/models';
import { BibleService } from '../services/bible.service';
import { abbreviateBookName } from '../utils/utils';

@Component({
  selector: 'app-passage-selector',
  templateUrl: './passage-selector.component.html',
  styleUrls: ['./passage-selector.component.scss']
})
export class PassageSelectorComponent {
  model: any = {};
  nWordsToPreview = 40;
  attemptLength = 0;
  dedupedAnchors: BiblePassage[] = [];
  abbreviateBookName = abbreviateBookName;

  constructor(
    private _bibleService: BibleService,
  ) {
  }

  getBooks(): Book[] {
    return this._bibleService.bible.v;
  }

  getChapters(book: Book): Chapter[] {
    return book.v;
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
