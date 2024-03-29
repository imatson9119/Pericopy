import { Injectable } from '@angular/core';
import { IResult, ResultBank } from '../classes/models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  result_bank_storage_key = "result_bank"
  result_bank: ResultBank = {"results": []};
  storedIds = new Set<string>();

  constructor() { 
    let stored_result_bank = localStorage.getItem(this.result_bank_storage_key);
    if(stored_result_bank != null) {
      this.result_bank = JSON.parse(stored_result_bank);
      this.result_bank.results = this.result_bank.results.sort((a, b) =>b.timestamp - a.timestamp);
      this.result_bank.results.forEach(result => {
        this.storedIds.add(result.id);
      });
    }
  }

  storeAttempt(result: IResult){
    this.result_bank.results.unshift(result);
    if (this.storedIds.has(result.id)){
      return;
    }
    this.storedIds.add(result.id);
    this.storeBank();
  }

  deleteAttempt(index: number){
    this.storedIds.delete(this.result_bank.results[index].id);
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

  joinBanks(bank: ResultBank){
    for(let result of bank.results){
      this.storeAttempt(result);
    }
    this.storeBank();
  }
}
