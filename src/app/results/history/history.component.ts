import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { IResult } from 'src/app/classes/models';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { getRelativeDate, replacer } from 'src/app/utils/utils';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ImportDialogComponent } from './import-dialog/import-dialog.component';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements AfterViewInit {

  displayedColumns: string[] = ['time', 'title', 'score', 'actions'];
  dataSource = new MatTableDataSource<IResult>(this.getDataSource());
  filterValue = ''
  
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort = new MatSort(({ id: 'time', start: 'desc'}) as MatSortable);;

  constructor(private _storageService: StorageService, private _router: Router, private dialog: MatDialog) {
  }


  ngAfterViewInit() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'time': return item.timestamp;
        case 'title': return item.diff.p;
        case 'score': return item.score;
        default: return '';
      }
    };
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = (data, filter) => {
      return data.diff.p.toLowerCase().includes(filter);
    }
    this.dataSource.sort = this.sort;
    
  }

  applyFilter(event: Event) {
    if(this.dataSource.paginator != null){
      this.dataSource.paginator.firstPage();
    }
    this.dataSource.filter = this.filterValue.toLowerCase();
  }

  getAttempts() {
    return this._storageService.getAttempts();
  }

  loadResult(id: string) {
    this._router.navigate(['/results'], { queryParams: { id: id } }); 
  }

  getRelativeTime(timestamp: number): string | null{
    return getRelativeDate(timestamp);
  }

  getDataSource(){
    return [...this.getAttempts().values()]
  }

  formatScore(score: number): string {
    return Math.round(score * 100).toString() + '%';
  }

  openImportDialog() {
    this.dialog.open(ImportDialogComponent).afterClosed().subscribe(result => {
      this.dataSource = new MatTableDataSource<IResult>(this.getDataSource());
    });
  }
  
  downloadAttempts() {
    let attempts = this._storageService.resultBank;
    let data = JSON.stringify(attempts, replacer, 2);
    let blob = new Blob([data], { type: 'text/json' });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'pericopy_attempts.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
