import { Injectable } from '@angular/core';
import { Change } from 'diff';
import { BibleChange, Result, ResultBank } from '../models/models';

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
    }
  }

  storeAttempt(diff: BibleChange[]){
    let new_entry = this.processDiff(diff);
    this.result_bank.results.push(new_entry);
    localStorage.setItem(this.result_bank_storage_key, JSON.stringify(this.result_bank));
  }

  processDiff(diff: BibleChange[]): Result{
    return {
      "diff": diff,
      "timestamp": Date.now(),
      "score": this.gradeDiff(diff)
    }
  }
  
  gradeDiff(diff: BibleChange[]){
    return 1;
  }

  getBank(): ResultBank {
    return this.result_bank;
  }
}
