import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DiffType, IResult, ResultBank, VerseChange } from 'src/app/classes/models';
import { StorageService } from 'src/app/services/storage.service';
import { DisplayType } from '../diff-display/diff-display.component';
import { numberToColorHsl } from 'src/app/utils/utils';
import { MatDialog } from '@angular/material/dialog';
import { DeleteAttemptDialogComponent } from './delete-attempt-dialog/delete-attempt-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-single-attempt',
  templateUrl: './single-attempt.component.html',
  styleUrls: ['./single-attempt.component.scss']
})
export class SingleAttemptComponent implements OnInit {
  result_bank: ResultBank = {"results": []}
  diffTypes = DiffType;
  displayTypes = DisplayType;
  resultIndex = -1;

  currentResult: IResult | undefined = undefined;
  totalWords: number = 0;
  wordsAdded: number = 0;
  wordsRemoved: number = 0;

  constructor(private _router: Router, private _storageService: StorageService, private dialog: MatDialog, private snackbar: MatSnackBar) {}

  ngOnInit(): void {
    this.result_bank = this._storageService.getBank();
    let index = this._router.parseUrl(this._router.url).queryParams['i'];
    if(index != undefined){
      this.setResult(parseInt(index));
    } else {
      this.setResult(0);
    }
  }

  setResult(index: number): void {
    if(index < 0 || index > this.result_bank.results.length){
      this._router.navigateByUrl('/history');
      return;
    }
    this.resultIndex = index;
    this.currentResult = this.result_bank.results[index];
    this.generateResultStats();
  }

  isScripture(diff: VerseChange): boolean {
    return diff.t === DiffType.Unchanged || diff.t === DiffType.Removed;
  }

  isAttempt(diff: VerseChange): boolean {
    return diff.t === DiffType.Unchanged || diff.t === DiffType.Added;
  }

  deleteResult(): void {
    if(this.currentResult === undefined || this.resultIndex === -1){
      return;
    }
    this.dialog.open(DeleteAttemptDialogComponent).afterClosed().subscribe(result => {
      if(result){
        this._storageService.deleteAttempt(this.resultIndex);
        this.snackbar.open('Result deleted.', 'Dismiss', {duration: 2000});
        this._router.navigateByUrl('/history');
      }
    });
  }

  editResult(): void {

  }

  generateResultStats(): void {
    if(this.currentResult === undefined){
      return;
    }
    this.totalWords = 0;
    this.wordsAdded = 0;
    this.wordsRemoved = 0;
    for(let bookDiff of this.currentResult.diff.v){
      for(let chapterDiff of bookDiff.v){
        for(let verseDiff of chapterDiff.v){
          for(let change of verseDiff.v){
            if (change.t === DiffType.Added){
              this.wordsAdded += change.v.length;
            } else if (change.t === DiffType.Removed){
              this.wordsRemoved += change.v.length;
            }
            this.totalWords += change.v.length;
          }
        }
      }
    }
  }

  getColor(){
    if (!this.currentResult){
      return 'transparent';
    }
    return numberToColorHsl(1-this.currentResult.score, .117, .32);
  }

  getAccuracy(): number {
    return this.currentResult ? Math.round(this.currentResult.score * 100) : 0;
  }
}
