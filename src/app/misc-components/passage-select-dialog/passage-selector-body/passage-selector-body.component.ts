import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { BiblePassage } from '../../../classes/BiblePassage';
import { abbreviateBookName } from 'src/app/utils/utils';
import { SelectionType, VerseSelectorComponent } from '../../verse-selector/verse-selector.component';
import { Bible } from 'src/app/classes/Bible';
import { BiblePointer } from 'src/app/classes/models';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-passage-selector-body',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, VerseSelectorComponent],
  templateUrl: './passage-selector-body.component.html',
  styleUrl: './passage-selector-body.component.scss'
})
export class PassageSelectorBodyComponent {
  abbreviateBookName = abbreviateBookName;
  SelectionType = SelectionType;

  @ViewChild('start') start: VerseSelectorComponent | undefined = undefined;
  @ViewChild('end') end: VerseSelectorComponent | undefined = undefined;

  @Input() bible: Bible | undefined = undefined;
  @Input() nWordsToPreview: number = 40;
  @Input() providedOptions: BiblePassage[] = [];
  @Input() startRef: BiblePointer | undefined = undefined;
  @Input() endRef: BiblePointer | undefined = undefined;
  @Input() passage: BiblePassage | undefined = undefined;

  @Output() startRefChange = new EventEmitter<BiblePointer>();
  @Output() endRefChange = new EventEmitter<BiblePointer>();  
  @Output() passageChange = new EventEmitter<BiblePassage>();

  constructor() {
  }

  ngOnChanges() {
    if (this.passage) {
      this.selectPassage(this.passage);
    }
    this.providedOptions = this.dedupeAnchors(this.providedOptions);
  }

  dedupeAnchors(anchors: BiblePassage[]): BiblePassage[] {
    let deduped: BiblePassage[] = [];
    let seen: Set<string> = new Set();
    for (let anchor of anchors) {
      if (!seen.has(anchor.toString())) {
        deduped.push(anchor);
        seen.add(anchor.toString());
      }
    }
    return deduped;
  }

  getPreview(): string {
    if (this.isValid() && this.bible) {
      // @ts-ignore
      let startIndex: number = this.start.verse.m.i;
      // @ts-ignore
      let endIndex: number = this.end.verse.m.i + this.end.verse.m.l;
      if (endIndex - startIndex > this.nWordsToPreview) {
        let startText = this.bible.getText(
          startIndex,
          Math.min(startIndex + 20, endIndex - 10)
        );
        let endText = this.bible.getText(
          Math.max(endIndex - 20, startIndex + 10),
          endIndex
        );
        return startText + ' ... ' + endText;
      }
      return this.bible.getText(startIndex, endIndex);
    }
    return '';
  }

  isValid(): boolean {
    return (
      this.startRef !== undefined &&
      this.endRef !== undefined &&
      this.startRef.verse.m.i <= this.endRef.verse.m.i
    );
  }

  startRefChangeMethod() {
    this.startRefChange.emit(this.startRef);
    this.checkValidityAndEmit();
  }

  endRefChangeMethod() {
    this.endRefChange.emit(this.endRef);
    this.checkValidityAndEmit();
  }

  checkValidityAndEmit() {
    if (this.isValid()) {
      this.passageChange.emit(new BiblePassage(
        this.startRef!.index,
        this.endRef!.index,
        this.startRef!.book,
        this.startRef!.chapter,
        this.startRef!.verse,
        this.endRef!.book,
        this.endRef!.chapter,
        this.endRef!.verse
      ));
    }
  }

  selectPassage(passage: BiblePassage) {
    this.startRef = {
      book: passage.b1,
      chapter: passage.c1,
      verse: passage.v1,
      index: passage.v1.m.i,
    };
    this.endRef = {
      book: passage.b2,
      chapter: passage.c2,
      verse: passage.v2,
      index: passage.v2.m.i + passage.v2.m.l,
    };
    this.startRefChange.emit(this.startRef);
    this.endRefChange.emit(this.endRef);
    this.passageChange.emit(passage);
  }
}
