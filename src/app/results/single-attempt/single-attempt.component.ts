import { Component, Input, OnInit } from '@angular/core';
import { Change } from 'diff';
import { Result, ResultBank } from 'src/app/models/models';
import { trim_diff } from 'src/utils';

@Component({
  selector: 'app-single-attempt',
  templateUrl: './single-attempt.component.html',
  styleUrls: ['./single-attempt.component.scss']
})
export class SingleAttemptComponent implements OnInit {
  @Input()
  result_bank: ResultBank = {"results": []}

  current_result: Result | undefined = undefined;

  ngOnInit(): void {
    this.set_result(this.result_bank.results.length - 1);
  }

  set_result(index: number): void {
    if(index < 0 || index > this.result_bank.results.length){
      this.current_result = undefined;
      return;
    }
    this.current_result = this.result_bank.results[index];
    this.current_result.diff = trim_diff(this.current_result.diff)
  }



}
