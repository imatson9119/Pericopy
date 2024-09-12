import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
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
export class PassageSelectorBodyComponent implements OnChanges, OnInit {
  abbreviateBookName = abbreviateBookName;
  SelectionType = SelectionType;
  
  @Input() bible: Bible | undefined = undefined;
  @Input() nWordsToPreview: number = 40;
  @Input() providedOptions: BiblePassage[] = [];
  @Input() passage: BiblePassage | undefined = undefined;
  
  @Output() passageChange = new EventEmitter<BiblePassage>();
  
  startRef: BiblePointer | undefined = undefined;
  endRef: BiblePointer | undefined = undefined;
  preview: string = '';

  constructor() {}
  
  ngOnInit(): void {
    if (this.providedOptions.length > 0) {
      this.providedOptions = this.dedupeAnchors(this.providedOptions);
    }
    // console.log("Passage Selector: initial passage " + this.passage);
    if (this.passage) {
      this.selectPassage(this.passage);
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['providedOptions']) {
      this.providedOptions = this.dedupeAnchors(this.providedOptions);
    }
    if (changes['passage'] && this.passage) {
      // console.log("In passage selector, selected " + this.passage.toString() + " index: " + this.passage.i + "-" + this.passage.j);
      this.selectPassage(this.passage!);
    }
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
    if (this.isValid() && this.bible && this.passage) {
      let startIndex: number = this.passage.i
      let endIndex: number = this.passage.j
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
    this.checkValidityAndEmit();
  }

  endRefChangeMethod() {
    this.checkValidityAndEmit();
  }

  checkValidityAndEmit() {
    if (this.isValid()) {
      this.passageChange.emit(new BiblePassage(
        this.startRef!.index + this.startRef!.verse.m.i,
        this.endRef!.index + this.endRef!.verse.m.i,
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
      index: 0,
    };
    this.endRef = {
      book: passage.b2,
      chapter: passage.c2,
      verse: passage.v2,
      index: passage.v2.m.l + 1,
    };
    this.passage = passage;
    this.preview = this.getPreview();
    this.passageChange.emit(passage);
  }
}
