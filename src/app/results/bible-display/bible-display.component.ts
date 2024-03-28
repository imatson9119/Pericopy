import { Component, Input } from '@angular/core';
import { BiblePassage } from 'src/app/classes/BiblePassage';
import { DiffType, Heatmap } from 'src/app/classes/models';
import { BibleService } from 'src/app/services/bible.service';
import { hslToRgb, numberToColorHsl } from 'src/app/utils/utils';
import { quickColor } from 'src/app/utils/utils';

@Component({
  selector: 'app-bible-display',
  templateUrl: './bible-display.component.html',
  styleUrls: ['./bible-display.component.scss']
})
export class BibleDisplayComponent {
  diffTypes = DiffType;
  
  @Input() passage: BiblePassage = {} as BiblePassage;
  @Input() heatmap: Heatmap | null = null;

  constructor(private _bibleService: BibleService) {
    
  }

  getBible() {
    return this._bibleService.bible.v;
  }
  
  intersection(i1: number, i2: number, j1: number, j2: number): boolean {
    return i1 <= (j2-1) && j1 <= (i2-1);
  }

  getColor(i: number){
    if (!this.heatmap){
      return 'transparent';
    }
    let record = this.heatmap.get(i);
    if(!record){
      return 'transparent';
    }
    let score = (record[DiffType.Added] + record[DiffType.Removed]) / record.reduce((acc, cv) => acc + cv, 0);
    return numberToColorHsl(score);
  }

  

}
