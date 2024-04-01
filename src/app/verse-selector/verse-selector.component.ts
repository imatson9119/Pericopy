import { Component, Input } from '@angular/core';
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

  verse: Verse | any = null;
  chapter: Chapter | any = null;
  book: Book | any = null;

  finishedSelection: boolean = false;

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
}
