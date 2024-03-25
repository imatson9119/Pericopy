import { Component, Input } from '@angular/core';
import { BiblePassage } from '../../classes/BiblePassage';
import { Book, Chapter, Verse } from '../../classes/models';
import { BibleService } from '../../services/bible.service';
import { abbreviateBookName } from '../../utils/utils';

@Component({
  selector: 'app-passage-selector',
  templateUrl: './passage-selector.component.html',
  styleUrls: ['./passage-selector.component.scss']
})
export class PassageSelectorComponent {
  @Input()
  b: Book | null = null;
  @Input()
  c: Chapter | null = null;
  @Input()
  v: Verse | null = null;



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
    if (!this.b || !this.c || !this.v) {
      return false;
    }
    return true;
  }

}
