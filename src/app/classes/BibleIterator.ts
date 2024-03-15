import { Bible } from './Bible';
import { BibleWord, Book, Chapter, Verse } from './models';

export class BibleIterator implements IterableIterator<BibleWord> {
  bible: Bible;
  start: number;
  curLoc: number;
  stop: number;
  curBook: Book;
  curBookIndex: number;
  curChapter: Chapter;
  curChapterIndex: number;
  curVerse: Verse;
  curVerseIndex: number;

  constructor(bible: Bible, start = 0, stop = bible.m.l) {
    if (start < 0 || start > bible.m.l) {
      throw new Error('Invalid start index');
    } else if (stop < 0 || stop > bible.m.l) {
      throw new Error('Invalid stop index');
    } else if (start > stop) {
      throw new Error('Start index must be less than or equal to stop index');
    }
    this.bible = bible;
    this.start = start;
    this.stop = stop;
    this.curBook = {} as Book;
    this.curBookIndex = 0;
    this.curChapter = {} as Chapter;
    this.curChapterIndex = 0;
    this.curVerse = {} as Verse;
    this.curVerseIndex = 0;
    this.curLoc = start;
    for (let [index, book] of this.bible.v.entries()) {
      if (start < book.m.i + book.m.l) {
        this.curBook = book;
        this.curBookIndex = index;
        break;
      }
    }
    if (!this.curBook) {
      throw new Error('Book not found');
    }
    for (let [index, chapter] of this.curBook.v.entries()) {
      if (start < chapter.m.i + chapter.m.l) {
        this.curChapter = chapter;
        this.curChapterIndex = index;
        break;
      }
    }
    if (!this.curChapter) {
      throw new Error('Chapter not found');
    }
    for (let [index, verse] of this.curChapter.v.entries()) {
      if (start < verse.m.i + verse.m.l) {
        this.curVerse = verse;
        this.curVerseIndex = index;
        break;
      }
    }
    if (!this.curVerse) {
      throw new Error('Verse not found');
    }
  }

  [Symbol.iterator](): IterableIterator<BibleWord> {
    return this;
  }

  next(): IteratorResult<BibleWord> {
    if (this.curLoc >= this.stop) {
      return { done: true, value: null };
    }
    let word = this.curVerse.v[this.curLoc - this.curVerse.m.i];
    let result = {
      done: false,
      value: {
        word: word,
        index: this.curLoc,
        book: this.curBook,
        chapter: this.curChapter,
        verse: this.curVerse,
      },
    };
    this.curLoc++;
    if (this.curLoc >= this.curVerse.m.i + this.curVerse.m.l) {
      if (this.curLoc >= this.curChapter.m.i + this.curChapter.m.l) {
        if (this.curLoc >= this.curBook.m.i + this.curBook.m.l) {
          if (this.curLoc >= this.bible.m.i + this.bible.m.l) {
            return { done: true, value: null };
          } else {
            this.curBookIndex++;
            this.curBook = this.bible.v[this.curBookIndex];
            this.curChapter = this.curBook.v[0];
            this.curChapterIndex = 0;
            this.curVerse = this.curChapter.v[0];
            this.curVerseIndex = 0;
          }
        } else {
          this.curChapterIndex++;
          this.curChapter = this.curBook.v[this.curChapterIndex];
          this.curVerse = this.curChapter.v[0];
          this.curVerseIndex = 0;
        }
      } else {
        this.curVerseIndex++;
        this.curVerse = this.curChapter.v[this.curVerseIndex];
      }
    }
    return result;
  }
}
