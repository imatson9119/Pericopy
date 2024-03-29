import { Component, ViewChild } from '@angular/core';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { StorageService } from 'src/app/services/storage.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss']
})
export class ImportDialogComponent {
  @ViewChild('fileUpload') fileUpload: FileUploadComponent | null = null;

  constructor(private _storageService: StorageService, private dialog: MatDialog) { }

  canSubmit() {
    return this.fileUpload ? this.fileUpload.getFiles().length > 0 : false;
  }

  submit() {
    if(this.fileUpload){
      this.fileUpload.getFiles().forEach(file => {
        file.text().then(text => {
          let data = JSON.parse(text);
          this._storageService.joinBanks(data) 
        });
      });
    }
    this.dialog.closeAll();
  }
}
