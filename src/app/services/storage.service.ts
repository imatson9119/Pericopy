import { Injectable } from '@angular/core';
import { IResult, ResultBank } from '../classes/models';

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

  storeAttempt(result: IResult){
    this.result_bank.results.unshift(result);
    this.storeBank();
  }

  deleteAttempt(index: number){
    this.result_bank.results.splice(index, 1);
    this.storeBank();
  }

  storeBank(){
    localStorage.setItem(this.result_bank_storage_key, JSON.stringify(this.result_bank));
  }

  getAttempts(){
    return this.result_bank.results;
  }

  getBank(): ResultBank {
    return this.result_bank;
  }
}
