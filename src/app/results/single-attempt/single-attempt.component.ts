import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DiffType, IResult, ResultBank } from 'src/app/classes/models';
import { BibleService } from 'src/app/services/bible.service';


@Component({
  selector: 'app-single-attempt',
  templateUrl: './single-attempt.component.html',
  styleUrls: ['./single-attempt.component.scss']
})
export class SingleAttemptComponent implements OnInit {
  @Input()
  result_bank: ResultBank = {"results": []}
  diffTypes = DiffType;

  current_result: IResult | undefined = undefined;

  constructor(private _bibleService: BibleService, private _router: Router) {}

  ngOnInit(): void {
    let index = this._router.parseUrl(this._router.url).queryParams['i'];
    if(index != undefined){
      this.setResult(parseInt(index));
    } else {
      this.setResult(this.result_bank.results.length - 1);
    }

    
  }

  setResult(index: number): void {
    if(index < 0 || index > this.result_bank.results.length){
      this.current_result = undefined;
      return;
    }
    this.current_result = this.result_bank.results[index];
  }
}
