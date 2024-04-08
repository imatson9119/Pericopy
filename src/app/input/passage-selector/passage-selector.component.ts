import { Component, Input, OnDestroy } from '@angular/core';
import { BiblePassage } from '../../classes/BiblePassage';
import { Book, Chapter, Verse } from '../../classes/models';
import { BibleService } from '../../services/bible.service';
import { abbreviateBookName } from '../../utils/utils';
import { Bible } from 'src/app/classes/Bible';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-passage-selector',
  templateUrl: './passage-selector.component.html',
  styleUrls: ['./passage-selector.component.scss'],
})
export class PassageSelectorComponent implements OnDestroy {
  @Input()
  label: string = "";
  @Input()
  b: Book = {} as Book;
  @Input()
  c: Chapter = {} as Chapter;
  @Input()
  v: Verse = {} as Verse;

  nWordsToPreview = 40;
  attemptLength = 0;
  dedupedAnchors: BiblePassage[] = [];
  abbreviateBookName = abbreviateBookName;
  bible: Bible | undefined = undefined;
  subsciprtions: Subscription[] = [];

  constructor(private _bibleService: BibleService) {
    this.subsciprtions.push(this._bibleService.curBible.subscribe(
      (bible) => {
        this.bible = bible;
      }
    ));
  }

  ngOnDestroy() {
    this.subsciprtions.forEach(sub => sub.unsubscribe());
  }

  getBooks(): Book[] {
    if (this.bible === undefined) {
      return [];
    }
    return this.bible.v;
  }

  isValid(): boolean {
    return (
      this.b.m !== undefined &&
      this.c.m !== undefined &&
      this.v.m !== undefined &&
      this.v.m.i >= this.c.m.i &&
      this.v.m.i + this.v.m.l <= this.c.m.i + this.c.m.l &&
      this.c.m.i >= this.b.m.i &&
      this.c.m.i + this.c.m.l <= this.b.m.i + this.b.m.l
    );
  }

  resetVerse() {
    this.v = {} as Verse;
  }

  resetChapter() {
    this.resetVerse();
    this.c = {} as Chapter;
  }

  reset() {
    this.resetChapter();
    this.b = {} as Book;
  }
}
