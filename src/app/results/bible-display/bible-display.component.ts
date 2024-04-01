import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BiblePassage } from 'src/app/classes/BiblePassage';
import { DiffType, Heatmap, Verse } from 'src/app/classes/models';
import { BibleService } from 'src/app/services/bible.service';
import { numberToColorHsl } from 'src/app/utils/utils';

@Component({
  selector: 'app-bible-display',
  templateUrl: './bible-display.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./bible-display.component.scss']
})
export class BibleDisplayComponent {
  diffTypes = DiffType;
  
  @Input() passage: BiblePassage = {} as BiblePassage;
  @Input() heatmap: Heatmap | null = null;

  constructor(private _bibleService: BibleService) {
    
  }

  getBooks() {
    return this._bibleService.bible.v.filter(book => this.intersection(
      book.m.i, book.m.i + book.m.l, this.passage.i, this.passage.j
    ));
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

  trackByWord(index: number, item: any) {
    return index;
  }  

  trackByVerse(index: number, item: Verse) {
    return item.m.i;
  }

  trackByChapter(index: number, item: any) {
    return item.m.i;
  }

  trackByBook(index: number, item: any) {
    return item.m.i;
  }

}
