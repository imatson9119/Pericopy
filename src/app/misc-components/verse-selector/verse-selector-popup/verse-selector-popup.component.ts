import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Book } from 'src/app/classes/models';
import { abbreviateBookName } from '../../../utils/utils';
import { Bible } from 'src/app/classes/Bible';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verse-selector-popup',
  templateUrl: './verse-selector-popup.component.html',
  styleUrls: ['./verse-selector-popup.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatIconModule, CommonModule]
})
export class VerseSelectorPopupComponent {
  
  abbreviateBookName = abbreviateBookName;
  selectionStage: number = 0;
  selectionLevel: string = 'verse';
  value: any = {"book": null, "chapter": null, "verse": null};
  subscriptions: Subscription[] = [];
  bible: Bible | undefined = undefined;
  curSearch: string = ''; // Current search string


  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<VerseSelectorPopupComponent>, private dialog: MatDialog) { 
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

    this.bible = data.bible;
    document.addEventListener('keydown', (event) => {
      this.searchForButton(event.key);
    });
  }

  getBooks() {
    if (this.bible === undefined) {
      return [];
    }
    return this.bible.v;
  }

  selectBook(book: Book){
    this.value.book = book;
    this.value.chapter = null;
    this.value.verse = null;
    this.curSearch = '';
    if (this.selectionLevel === 'book'){
      this.submit();
    }
    this.selectionStage++;
  }

  selectChapter(chapter: any){
    this.value.chapter = chapter;
    this.value.verse = null;
    this.curSearch = '';
    if (this.selectionLevel === 'chapter'){
      this.submit();
    }
    this.selectionStage++;
  }

  selectVerse(verse: any){
    this.value.verse = verse;
    this.curSearch = '';
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

  searchForButton(key: string) {
    if (key === 'Backspace') {
      this.curSearch = this.curSearch.slice(0, -1);
    }
    // check if the key is a valid key
    if (this.selectionStage === 0 && (key.length > 1 || !key.match(/[a-z0-9]/i))) {
      return;
    }
    if (this.selectionStage > 0 && (key.length > 1 || !key.match(/[0-9]/i))) {
      return;
    }
    this.curSearch += key;
    const buttons: any = Array.from(document.querySelectorAll('.verse-selector-button'))
    while(this.curSearch.length > 0) {
      for(let button of buttons) {
        const search = this.curSearch.toLowerCase();
        const buttonText = button.textContent.toLowerCase().replace(/\s/g, '');
        if (buttonText.startsWith(search)) {
          button.focus();
          return;
        }
      }
      this.curSearch = this.curSearch.slice(1);
    }
  }
}
