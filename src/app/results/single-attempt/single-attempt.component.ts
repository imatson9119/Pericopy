import { Component, Input, OnInit } from '@angular/core';
import { Result, ResultBank } from 'src/app/models/models';
import { BibleService } from 'src/app/services/bible.service';
import { trimDiff } from 'src/utils';

@Component({
  selector: 'app-single-attempt',
  templateUrl: './single-attempt.component.html',
  styleUrls: ['./single-attempt.component.scss']
})
export class SingleAttemptComponent implements OnInit {
  @Input()
  result_bank: ResultBank = {"results": []}

  current_result: Result | undefined = undefined;

  constructor(private _bibleService: BibleService) {}

  ngOnInit(): void {
    this.setResult(this.result_bank.results.length - 1);
  }

  setResult(index: number): void {
    if(index < 0 || index > this.result_bank.results.length){
      this.current_result = undefined;
      return;
    }
    this.current_result = this.result_bank.results[index];
    this.current_result.diff.diff = trimDiff(this.current_result.diff.diff)
  }
}
