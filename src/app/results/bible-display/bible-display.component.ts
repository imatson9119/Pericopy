import { Component, Input } from '@angular/core';
import { BiblePassage } from 'src/app/classes/BiblePassage';
import { DiffType, Heatmap } from 'src/app/classes/models';
import { BibleService } from 'src/app/services/bible.service';
import { hslToRgb } from 'src/app/utils/utils';
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
    return this.numberToColorHsl(score);
  }

  numberToColorHsl(i: number) {
    i = (1 - i) * 100;
    // as the function expects a value between 0 and 1, and red = 0° and green = 120°
    // we convert the input to the appropriate hue value
    var hue = i * 1.2 / 360;
    // we convert hsl to rgb (saturation 100%, lightness 50%)
    var rgb = hslToRgb(hue, .4, .8);
    // we format to css value and return
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; 
  }

}
