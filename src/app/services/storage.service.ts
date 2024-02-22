import { Injectable } from '@angular/core';
import { Change } from 'diff';
import { Result, ResultBank } from '../models/models';

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

  store_attempt(diff: Change[]){
    let new_entry = this.process_diff(diff);
    this.result_bank.results.push(new_entry);
    localStorage.setItem(this.result_bank_storage_key, JSON.stringify(this.result_bank));
  }

  process_diff(diff: Change[]): Result{
    return {
      "diff": diff,
      "timestamp": Date.now(),
      "score": this.grade_diff(diff)
    }
  }
  
  grade_diff(diff: Change[]){
    return 1;
  }
}
