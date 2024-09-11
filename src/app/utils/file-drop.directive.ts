import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appFileDrop]'
})
export class FileDropDirective {

  @Output() filesDropped: any = new EventEmitter();
  @Output() filesHovered: any = new EventEmitter();
  
  constructor() { }

  @HostListener('drop', ['$event'])
  onDrop($event: any) {
    $event.preventDefault();
    this.filesDropped.emit($event.dataTransfer.files);
    this.filesHovered.emit(false);
  }

  @HostListener('dragover', ['$event'])
  onDragOver($event: any) {
    $event.preventDefault();
    this.filesHovered.emit(true);
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter($event: any) {
    $event.preventDefault();
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave($event: any) {
    $event.preventDefault();
    this.filesHovered.emit(false);
  }
}
