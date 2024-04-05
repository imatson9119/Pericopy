import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Verse, Chapter, Book } from '../classes/models';
import { VerseSelectorPopupComponent } from './verse-selector-popup/verse-selector-popup.component';

@Component({
  selector: 'app-verse-selector',
  templateUrl: './verse-selector.component.html',
  styleUrls: ['./verse-selector.component.scss']
})
export class VerseSelectorComponent {
  @Input()
  selectionLevel: string = 'verse';

  @Input()
  value: any = {'verse': null, 'chapter': null, 'book': null};

  @Output()
  valueChange = new EventEmitter<any>();
  
  @Output()
  select = new EventEmitter<any>()

  @Input()
  finishedSelection: boolean = false;

  @Input()
  disabled: boolean = false;

  @Input()
  off: boolean = false;

  constructor(private dialog: MatDialog) { }

  openSelectionMenu() {
    this.dialog.open(VerseSelectorPopupComponent, {
      data: {
        selectionLevel: this.selectionLevel,
        book: this.value.book,
        chapter: this.value.chapter,
        verse: this.value.verse,
      },
    }).afterClosed().subscribe((result: any) => {
      if (result) {
        this.setValue(result.book, result.chapter, result.verse);
      }
    });
  }

  getDisplayValue() {
    if (this.value.verse && this.value.chapter && this.value.book) {
      return `${this.value.book.m.b} ${this.value.chapter.m.c}:${this.value.verse.m.v}`;
    } else if (this.value.chapter && this.value.book) {
      return `${this.value.book.m.b} ${this.value.chapter.m.c}`;
    } else if (this.value.book) {
      return `${this.value.book.m.b}`;
    } else {
      return `Select ${this.selectionLevel}`;
    }
  }

  reset() {
    this.value.verse = null;
    this.value.chapter = null;
    this.value.book = null;
    this.finishedSelection = false;
  }

  get verse() {
    return this.value.verse;
  }

  get chapter() {
    return this.value.chapter;
  }

  get book() {
    return this.value.book;
  }

  get valid() {
    return ((this.selectionLevel === 'book' && this.value.book) ||
      (this.selectionLevel === 'chapter' && this.value.book && this.value.chapter) ||
      (this.selectionLevel === 'verse' && this.value.book && this.value.chapter && this.value.verse)) &&
      (this.chapter ? this.book &&  this.chapter.m.i >= this.book.m.i && this.chapter.m.i + this.chapter.m.l <= this.book.m.i + this.book.m.l : true) &&
      (this.verse ? this.chapter && this.verse.m.i >= this.chapter.m.i && this.verse.m.i + this.verse.m.l <= this.chapter.m.i + this.chapter.m.l : true);
  }

  set verse(verse: Verse | null) {
    this.setValue(this.value.book, this.value.chapter, verse);
  }

  set chapter(chapter: Chapter | null) {
    this.setValue(this.value.book, chapter, this.value.verse);
  }

  set book(book: Book | null) {
    this.setValue(book, this.value.chapter, this.value.verse);
  }


  setValue(book: Book | null = null, chapter: Chapter | null = null, verse: Verse | null = null) {
    this.value.book = book;
    this.value.chapter = chapter;
    this.value.verse = verse;
    if (this.selectionLevel === 'book' && this.value.book) {
      this.finishedSelection = true;
    } else if (this.selectionLevel === 'chapter' && this.value.book && this.value.chapter) {
      this.finishedSelection = true;
    } else if (this.selectionLevel === 'verse' && this.value.book && this.value.chapter && this.value.verse) {
      this.finishedSelection = true;
    }
    this.select.emit(this.value);
    this.valueChange.emit(this.value);
  }
}
