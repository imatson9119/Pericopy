import { Component, Input } from '@angular/core';
import { ResultBank } from 'src/app/models/models';

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss']
})
export class HeatmapComponent {
  @Input()
  result_bank: ResultBank = {"results": []}
}
