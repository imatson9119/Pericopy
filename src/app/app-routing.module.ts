import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InputComponent } from './input/input.component';
import { ResultsComponent } from './results/results.component';
import { HistoryComponent } from './results/history/history.component';

const routes: Routes = [
  { path: 'test', component: InputComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'history', component: HistoryComponent },
  { path: '',   redirectTo: '/test', pathMatch: 'full' },
  { path: '**', redirectTo: '/test',}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
