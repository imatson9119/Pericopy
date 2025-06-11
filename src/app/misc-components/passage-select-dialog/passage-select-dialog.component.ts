import { Component, inject, Inject, OnDestroy } from '@angular/core';
import { BibleService } from '../../services/bible.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BiblePassage } from '../../classes/BiblePassage';
import { abbreviateBookName } from 'src/app/utils/utils';
import { Bible } from 'src/app/classes/Bible';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { PassageSelectorBodyComponent } from './passage-selector-body/passage-selector-body.component';

@Component({
    selector: 'app-passage-select-dialog',
    templateUrl: './passage-select-dialog.component.html',
    styleUrls: ['./passage-select-dialog.component.scss'],
    imports: [MatDialogModule, MatButtonModule, PassageSelectorBodyComponent]
})
export class PassageSelectDialogComponent implements OnDestroy {
  private _bibleService = inject(BibleService);
  private _dialogRef = inject(MatDialogRef<PassageSelectDialogComponent>);
  private _data = inject(MAT_DIALOG_DATA);

  nWordsToPreview = 40;
  providedOptions: BiblePassage[] = [];
  abbreviateBookName = abbreviateBookName;
  passage: BiblePassage | undefined = undefined;
  bible = this._bibleService.bible;
  subscriptions: Subscription[] = [];
  title = 'Select a passage';
  subtitle = 'Please select a passage from the Bible.';
  isValid = false;


  constructor() {
    if (this._data) {
      if (this._data.title) this.title = this._data.title;
      if (this._data.subtitle) this.subtitle = this._data.subtitle;
      if (this._data.options) this.providedOptions = this._data.options
      if (this._data.passage) this.passage = this._data.passage;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }


  submit() {
    if (this.passage) {
      this._dialogRef.close(this.passage);
    }
  }

  validityChange(valid: boolean) { 
    this.isValid = valid;
  }
}
