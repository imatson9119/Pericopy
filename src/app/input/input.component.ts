import { Component } from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { Change, diffWords } from 'diff'
import bible from '../../romans.json'
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent {
  attempt = ""

  constructor(private _storageService: StorageService){}

  submit() {
    let diff: Change[] = diffWords(bible.romans[0], this.attempt, {"ignoreCase": true, "ignoreWhitespace": true});
    this._storageService.store_attempt(diff)
    
  }

}
