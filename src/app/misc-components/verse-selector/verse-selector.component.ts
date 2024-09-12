import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BiblePointer } from '../../classes/models';
import { VerseSelectorPopupComponent } from './verse-selector-popup/verse-selector-popup.component';
import { Bible } from '../../classes/Bible';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export enum SelectionType {
  START,
  END,
}

@Component({
  selector: 'app-verse-selector',
  templateUrl: './verse-selector.component.html',
  styleUrls: ['./verse-selector.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatIconModule, CommonModule, MatButtonModule],
})
export class VerseSelectorComponent implements OnChanges {
  @Input()
  selectionLevel: string = 'verse';

  @Input()
  bible: Bible | undefined = undefined;

  @Input()
  value: BiblePointer | undefined = undefined;

  @Input()
  type: 'button' | 'fab' = 'button';

  @Input()
  icon: string = 'book_2';

  @Input()
  selectionType: SelectionType = SelectionType.START;

  @Output()
  valueChange = new EventEmitter<BiblePointer>();

  @Output()
  select = new EventEmitter<BiblePointer>();

  @Output()
  valid = new EventEmitter<boolean>();

  @Input()
  finishedSelection: boolean = false;

  @Input()
  disabled: boolean = false;

  @Input()
  off: boolean = false;

  constructor(private dialog: MatDialog) {}

  openSelectionMenu() {
    let dialogRef = this.dialog
      .open(VerseSelectorPopupComponent, {
        data: {
          bible: this.bible,
          selectionLevel: this.selectionLevel,
          book: this.value?.book,
          chapter: this.value?.chapter,
          verse: this.value?.verse,
        },
      })
      .afterClosed()
      .subscribe((result: any) => {
        if (result) {
          let book = result.book;
          let chapter = result.chapter;
          let verse = result.verse;
          if (book && chapter && verse) {
            this.setValue({
              book: book,
              chapter: chapter,
              verse: verse,
              index:
                this.selectionType === SelectionType.START
                  ? 0
                  : verse.m.l
            });
          } else if (book && chapter) {
            this.setValue({
              book: book,
              chapter: chapter,
              verse: 
                this.selectionType === SelectionType.START
                  ? chapter.v[0]
                  : chapter.v[chapter.v.length - 1],
              index:
                this.selectionType === SelectionType.START
                  ? 0
                  : chapter.v[chapter.v.length - 1].m.l,
            });
          } else if (book) {
            this.setValue({
              book: book,
              chapter: 
                this.selectionType === SelectionType.START
                  ? book.c[0]
                  : book.c[book.c.length - 1],
              verse: 
                this.selectionType === SelectionType.START
                  ? book.c[0].v[0]
                  : book.c[book.c.length - 1].v[book.c[book.c.length - 1].v.length - 1],
              index: 
                this.selectionType === SelectionType.START
                  ? 0
                  : book.c[book.c.length - 1].v[book.c[book.c.length - 1].v.length - 1].m.l,
            });
          }
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bible']) {
      this.updateObjectRerencesWithNewBible();
    }
  }

  updateObjectRerencesWithNewBible() {
    // console.log("Updating object references with new Bible");
    if (!this.bible || !this.value) {
      return;
    }
    let bookI = this.value.book ? this.value.book.m.bn : 0;
    let chapterI = this.value.chapter ? Number(this.value.chapter.m.c) - 1 : 0;
    let verseI = this.value.verse ? Number(this.value.verse.m.v) - 1 : 0;
    let newLoc = this.bible.getWithoutIndex(bookI, chapterI, verseI);
    this.setValue({
      book: newLoc.book,
      chapter: newLoc.chapter,
      verse: newLoc.verse,
      index: this.selectionType === SelectionType.START ? 0 : newLoc.verse.m.l,
    });
  }

  getDisplayValue() {
    if (this.value) {
      if (this.selectionLevel === 'verse') {
        return `${this.value.book.m.b} ${this.value.chapter.m.c}:${this.value.verse.m.v}`;
      } else if (this.selectionLevel === 'chapter') {
        return `${this.value.book.m.b} ${this.value.chapter.m.c}`;
      } else {
        return `${this.value.book.m.b}`;
      }
    }
    return `Select ${this.selectionLevel}`;
  }

  reset() {
    this.value = undefined;
    this.finishedSelection = false;
  }

  get verse() {
    return this.value ? this.value.verse : null;
  }

  get chapter() {
    return this.value ? this.value.chapter : null;
  }

  get book() {
    return this.value ? this.value.book : null;
  }

  isValid(): boolean {
    if (!this.bible || !this.value) {
      return false;
    }
    let chapter = this.value.chapter;
    let book = this.value.book;
    let verse = this.value.verse;
    return (
      (chapter
        ? book &&
          chapter.m.i >= book.m.i &&
          chapter.m.i + chapter.m.l <= book.m.i + book.m.l
        : true) &&
      (verse
        ? chapter &&
          verse.m.i >= chapter.m.i &&
          verse.m.i + verse.m.l <= chapter.m.i + chapter.m.l
        : true)
    );
  }

  setValue(pointer: BiblePointer | undefined) {
    this.value = pointer;
    this.finishedSelection = true;
    this.valueChange.emit(this.value);
    this.valid.emit(this.isValid());
    this.select.emit(this.value);
    // console.log("Set index to " + this.value?.index);
  }
}
