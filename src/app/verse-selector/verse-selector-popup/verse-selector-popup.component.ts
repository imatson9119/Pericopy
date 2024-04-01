import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Book } from 'src/app/classes/models';
import { BibleService } from 'src/app/services/bible.service';
import { abbreviateBookName } from '../../utils/utils';

@Component({
  selector: 'app-verse-selector-popup',
  templateUrl: './verse-selector-popup.component.html',
  styleUrls: ['./verse-selector-popup.component.scss']
})
export class VerseSelectorPopupComponent {

  abbreviateBookName = abbreviateBookName;
  selectionStage: number = 0;
  selectionLevel: string = 'verse';
  value: any = {"book": null, "chapter": null, "verse": null};

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<VerseSelectorPopupComponent>, private dialog: MatDialog, private _bibleService: BibleService) { 
    this.selectionLevel = data.selectionLevel;
    if(data.book){
      this.value.book = data.book;
      if (this.selectionLevel !== 'book'){
        this.selectionStage = 1;
      }
    }
    if(data.chapter){
      this.value.chapter = data.chapter;
      if (this.selectionLevel !== 'chapter' && this.selectionLevel !== 'book'){
        this.selectionStage = 2;
      }
    }
    if(data.verse){
      this.value.verse = data.verse;
    }
  }

  getBooks() {
    return this._bibleService.bible.v;
  }

  selectBook(book: Book){
    this.value.book = book;
    this.value.chapter = null;
    this.value.verse = null;
    if (this.selectionLevel === 'book'){
      this.submit();
    }
    this.selectionStage++;
  }

  selectChapter(chapter: any){
    this.value.chapter = chapter;
    this.value.verse = null;
    if (this.selectionLevel === 'chapter'){
      this.submit();
    }
    this.selectionStage++;
  }

  selectVerse(verse: any){
    this.value.verse = verse;
    this.submit();
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    this.dialogRef.close(this.value);
  }

  goToChapters() {
    this.selectionStage = 1;
  }

  goToBooks() {
    this.selectionStage = 0;
  }

}
