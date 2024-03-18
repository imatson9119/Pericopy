import { Injectable } from '@angular/core';
import { BibleDiffNew, IResult, ResultBank } from '../classes/models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  result_bank_storage_key = "result_bank"
  result_bank: ResultBank = {"results": []};

  constructor() { 
    let stored_result_bank = localStorage.getItem(this.result_bank_storage_key);
    if(stored_result_bank != null) {
      this.result_bank = JSON.parse(stored_result_bank);
      this.result_bank.results = this.result_bank.results.sort((a, b) =>b.timestamp - a.timestamp);
    }
  }

  storeAttempt(diff: BibleDiffNew){
    let new_entry = this.processDiff(diff);
    this.result_bank.results.unshift(new_entry);
    localStorage.setItem(this.result_bank_storage_key, JSON.stringify(this.result_bank));
  }

  deleteAttempt(index: number){
    this.result_bank.results.splice(index, 1);
    localStorage.setItem(this.result_bank_storage_key, JSON.stringify(this.result_bank));
  }

  processDiff(diff: BibleDiffNew): IResult{
    return {
      "diff": diff,
      "timestamp": Date.now(),
      "score": this.gradeDiff(diff)
    }
  }

  getAttempts(){
    return this.result_bank.results;
  }
  
  gradeDiff(diff: BibleDiffNew){
    return 1;
  }

  getBank(): ResultBank {
    return this.result_bank;
  }
}
