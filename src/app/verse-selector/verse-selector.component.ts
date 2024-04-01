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
  
  @Output()
  select = new EventEmitter<any>()

  @Input()
  verse: Verse | any = null;

  @Input()
  chapter: Chapter | any = null;

  @Input()
  book: Book | any = null;

  @Input()
  finishedSelection: boolean = false;

  @Input()
  disabled: boolean = false;

  constructor(private dialog: MatDialog) { }

  openSelectionMenu() {
    this.dialog.open(VerseSelectorPopupComponent, {
      data: {
        selectionLevel: this.selectionLevel,
        book: this.book,
        chapter: this.chapter,
        verse: this.verse,
      },
    }).afterClosed().subscribe((result: any) => {
      if (result) {
        this.book = result.book; 
        this.chapter = result.chapter;
        this.verse = result.verse;
        this.finishedSelection = true;
        this.select.emit({book: this.book, chapter: this.chapter, verse: this.verse});
      }
    });
  }

  getDisplayValue() {
    if (this.verse && this.chapter && this.book) {
      return `${this.book.m.b} ${this.chapter.m.c}:${this.verse.m.v}`;
    } else if (this.chapter && this.book) {
      return `${this.book.m.b} ${this.chapter.m.c}`;
    } else if (this.book) {
      return `${this.book.m.b}`;
    } else {
      return `Select ${this.selectionLevel}`;
    }
  }

  reset() {
    this.verse = null;
    this.chapter = null;
    this.book = null;
    this.finishedSelection = false;
  }

  setValue(book: Book | null = null, chapter: Chapter | null = null, verse: Verse | null = null) {
    this.book = book;
    this.chapter = chapter;
    this.verse = verse;
    if (this.selectionLevel === 'book' && this.book) {
      this.finishedSelection = true;
    } else if (this.selectionLevel === 'chapter' && this.book && this.chapter) {
      this.finishedSelection = true;
    } else if (this.selectionLevel === 'verse' && this.book && this.chapter && this.verse) {
      this.finishedSelection = true;
    }
    this.select.emit({book: this.book, chapter: this.chapter, verse: this.verse});
  }
}
