import { AfterViewInit, Component, effect, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { IResult } from 'src/app/classes/models';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { getRelativeDate, replacer } from 'src/app/utils/utils';
import { MatSort, MatSortable, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ImportDialogComponent } from './import-dialog/import-dialog.component';
import { Bible } from 'src/app/classes/Bible';
import { BibleService } from 'src/app/services/bible.service';
import { Subscription } from 'rxjs';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
    imports: [
      MatTableModule,
      MatPaginatorModule,
      MatSortModule,
      MatInputModule,
      MatButtonModule,
      MatProgressSpinnerModule,
      MatIconModule,
      FormsModule
    ]
})
export class HistoryComponent implements AfterViewInit, OnDestroy, OnInit {

  private _storageService = inject(StorageService);
  private _router = inject(Router);
  private _bibleService = inject(BibleService);
  private dialog = inject(MatDialog);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private _snackbarService = inject(SnackbarService);

  filterValue = ''
  bible = this._bibleService.bible;
  subscriptions: Subscription[] = [];
  nAttempts = 0;
  
  displayedColumns: string[] = ['time', 'title', 'score'];
  dataSource = new MatTableDataSource<IResult>([]);
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort = new MatSort(({ id: 'time', start: 'desc'}) as MatSortable);

  bibleEffect = effect(() => {
    this.dataSource = new MatTableDataSource<IResult>(this.getDataSource());
    setTimeout(()=>{
      this.initSorting();
    }, 10);
  });

  ngOnInit(): void {
    const pageTitle = 'Recitation History | Pericopy';
    const pageDescription = 'View your complete history of scripture memorization attempts. Track your progress over time and see how your accuracy has improved.';

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:url', content: 'https://pericopy.net/history' });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit() {
    this.initSorting();
  }

  initSorting() {
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

  getAttempts(translation: string = '') {
    return this._storageService.getAttempts(translation);
  }

  loadResult(id: string) {
    this._router.navigate(['/results'], { queryParams: { id: id } }); 
  }

  getRelativeTime(timestamp: number, short = false): string | null{
    return getRelativeDate(timestamp, short);
  }

  getDataSource(){
    const bible = this.bible();
    if (bible === undefined) {
      return [];
    }
    let attempts = this.getAttempts(bible.m.t);
    this.nAttempts = attempts.size;
    return [...attempts.values()]
  }

  formatScore(score: number): string {
    return Math.round(score * 100).toString() + '%';
  }

  openImportDialog() {
    this.dialog.open(ImportDialogComponent).afterClosed().subscribe(result => {
      this.dataSource = new MatTableDataSource<IResult>(this.getDataSource());
      this.initSorting();
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
    this._snackbarService.showEmoji('📂', 'Attempts downloaded successfully!', 3000);
  }
}
