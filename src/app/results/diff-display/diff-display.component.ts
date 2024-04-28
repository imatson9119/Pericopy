import { Component, Input, OnInit } from '@angular/core';
import { Bible } from 'src/app/classes/Bible';
import { BibleDiff, DiffType } from 'src/app/classes/models';

export enum DisplayType {
  diff,
  scripture,
  attempt
}

@Component({
  selector: 'app-diff-display',
  templateUrl: './diff-display.component.html',
  styleUrls: ['./diff-display.component.scss']
})
export class DiffDisplayComponent implements OnInit {

  displayTypes = DisplayType;
  diffTypes = DiffType;
  
  @Input() diff: BibleDiff | null | undefined = null;
  @Input() type: DisplayType = DisplayType.diff;
  @Input() bible: Bible | null | undefined = null;

  scripture: string[] = [];

  constructor() { 

  } 

  ngOnInit(): void {
    if (this.diff && this.bible){
      this.scripture = this.bible.getText(this.diff.i, this.diff.j).split(/\s+/);
      // Remove empty strings
      for (let i = 0; i < this.scripture.length; i++){
        if (this.scripture[i].replace(/[^\w\s]/g, "").length === 0){
          this.scripture.splice(i, 1);
          i--;
        }
      }
    }
  }
}
