import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InputComponent } from './input/input.component';
import { HistoryComponent } from './results/history/history.component';
import { SingleAttemptComponent } from './results/single-attempt/single-attempt.component';

const routes: Routes = [
  { path: 'test', component: InputComponent },
  { path: 'results', component: SingleAttemptComponent },
  { path: 'history', component: HistoryComponent },
  { path: '',   redirectTo: '/test', pathMatch: 'full' },
  { path: '**', redirectTo: '/test',}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
