import { Component, Input } from '@angular/core';
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
export class DiffDisplayComponent {

  displayTypes = DisplayType;
  diffTypes = DiffType;
  
  @Input() diff: BibleDiff | null | undefined = null;
  @Input() type: DisplayType = DisplayType.diff;

  constructor() { } 
}
