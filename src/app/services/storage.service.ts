import { Injectable } from '@angular/core';
import { IResult, ResultBank } from '../classes/models';
import { replacer, reviver } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  result_bank_storage_key = "result_bank"
  resultBank: ResultBank = {"version": 1, "results": new Map()};

  constructor() { 
    this.initBank();
  }

  initBank() {
    let storedResultBank = localStorage.getItem(this.result_bank_storage_key);
    if (storedResultBank == null){
      this.storeBank();
      return;
    }
    let resultBank = JSON.parse(storedResultBank, reviver);
    if (resultBank.version == undefined){
      this.loadVersionZero(resultBank);
      this.storeBank();
      return;
    }
    this.resultBank = resultBank;
  }
  
  loadVersionZero(oldBank: any) {
    for (let result of oldBank.results){
      this.resultBank.results.set(result.id, result);
    }
  }

  storeAttempt(result: IResult){
    this.resultBank.results.set(result.id, result); 
    this.storeBank();
  }

  deleteAttempt(id: string){
    this.resultBank.results.delete(id);
    this.storeBank();
  }

  storeBank(){
    localStorage.setItem(this.result_bank_storage_key, JSON.stringify(this.resultBank, replacer));
  }

  getAttempts(){
    return this.resultBank.results;
  }

  getLastAttempt(){
    let attempts = this.getAttempts();
    let lastAttempt = undefined;
    for(let attempt of attempts.values()){
      if (lastAttempt == undefined || attempt.timestamp > lastAttempt.timestamp){
        lastAttempt = attempt;
      }
    }
    return lastAttempt;
  }

  getBank(): ResultBank {
    return this.resultBank;
  }

  joinBanks(bank: ResultBank){
    for(let result of bank.results.values()){
      this.storeAttempt(result);
    }
    this.storeBank();
  }
}
