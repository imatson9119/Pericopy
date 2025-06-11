import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReciteComponent } from './recite/recite.component';
import { HistoryComponent } from './results/history/history.component';
import { SingleAttemptComponent } from './results/single-attempt/single-attempt.component';
import { HeatmapComponent } from './results/heatmap/heatmap.component';
import { InfoComponent } from './info/info.component';
import { HomeComponent } from './home/home.component';
import { GoalComponent } from './goal/goal.component';
import { FreestyleComponent } from './freestyle/freestyle.component';
import { BlanksComponent } from './blanks/blanks.component';

export const routes: Routes = [
  { path: 'recite', component: ReciteComponent },
  { path: 'results', component: SingleAttemptComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'heatmap', component: HeatmapComponent },
  { path: 'info', component: InfoComponent },
  { path: 'goal', component: GoalComponent },
  { path: 'freestyle', component: FreestyleComponent },
  { path: 'blanks', component: BlanksComponent },
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '',}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
