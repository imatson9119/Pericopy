import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bible } from 'src/app/classes/Bible';
import { BiblePassage } from 'src/app/classes/BiblePassage';
import { DiffType, Heatmap, Verse } from 'src/app/classes/models';
import { intersection, numberToColorHsl } from 'src/app/utils/utils';

@Component({
  selector: 'app-bible-display',
  templateUrl: './bible-display.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./bible-display.component.scss']
})
export class BibleDisplayComponent {
  diffTypes = DiffType;
  intersection = intersection;
  
  @Input() passage: BiblePassage = {} as BiblePassage;
  @Input() bible: Bible | undefined = undefined;
  @Input() heatmap: Heatmap | null = null;

  constructor() {}
  
  getColor(i: number){
    if (!this.heatmap){
      return 'transparent';
    }
    let record = this.heatmap.get(i);
    if(!record){
      return 'transparent';
    }
    let score = (record[DiffType.ADDED] + record[DiffType.REMOVED]) / record.reduce((acc, cv) => acc + cv, 0);
    return numberToColorHsl(score);
  }
}
