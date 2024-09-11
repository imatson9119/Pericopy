import { Component, Inject, OnDestroy } from '@angular/core';
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
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, PassageSelectorBodyComponent],
})
export class PassageSelectDialogComponent implements OnDestroy {
  nWordsToPreview = 40;
  providedOptions: BiblePassage[] = [];
  abbreviateBookName = abbreviateBookName;
  passage: BiblePassage | undefined = undefined;
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  title = 'Select a passage';
  subtitle = 'Please select a passage from the Bible.';

  constructor(
    private _bibleService: BibleService,
    private _dialogRef: MatDialogRef<PassageSelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      if (data.title) this.title = data.title;
      if (data.subtitle) this.subtitle = data.subtitle;
      if (data.options) this.providedOptions = data.options
    }
    this.subscriptions.push(
      this._bibleService.curBible.subscribe((bible) => {
        this.bible = bible;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }


  submit() {
    if (this.passage) {
      this._dialogRef.close(this.passage);
    }
  }


  isValid(): boolean {
    return this.passage !== undefined;
  }

  selectPassage(passage: BiblePassage) {
    this.passage = passage;
  }
}
