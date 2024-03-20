import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { IResult } from 'src/app/classes/models';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { getRelativeDate } from 'src/app/utils/utils';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { DeleteAttemptDialogComponent } from './delete-attempt-dialog/delete-attempt-dialog.component';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements AfterViewInit{

  displayedColumns: string[] = ['title', 'score', 'time', 'actions'];
  dataSource = new MatTableDataSource<IResult>(this.getDataSource());
  filterValue = ''
  
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort | null = null;

  constructor(private _storageService: StorageService, private _router: Router, private _dialog: MatDialog) {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) => {
      return data.diff.p.toLowerCase().includes(filter);
    }
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'title': return item.diff.p;
        case 'score': return item.score;
        case 'time': return item.timestamp;
        default: return '';
      }
    }
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

  loadResult(index: number) {
    this._router.navigate(['/results'], { queryParams: { i: index } }); 
  }

  getRelativeTime(timestamp: number): string | null{
    return getRelativeDate(timestamp);
  }

  getDataSource(){
    return this.getAttempts().map((a, i) => {return {...a, index: i}});
  }

  deleteResult(index: number) {
    this._dialog.open(DeleteAttemptDialogComponent).afterClosed().subscribe((result) => {
      if (result) {
        this._storageService.deleteAttempt(index);
        this.dataSource.data = this.getDataSource();
      }
    });
  }
}
