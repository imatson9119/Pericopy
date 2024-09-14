import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InputComponent } from './input/input.component';
import { HistoryComponent } from './results/history/history.component';
import { SingleAttemptComponent } from './results/single-attempt/single-attempt.component';
import { HeatmapComponent } from './results/heatmap/heatmap.component';
import { InfoComponent } from './info/info.component';
import { HomeComponent } from './home/home.component';
import { GoalComponent } from './goal/goal.component';
import { MemorizeComponent } from './memorize/memorize.component';

const routes: Routes = [
  { path: 'recite', component: InputComponent },
  { path: 'results', component: SingleAttemptComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'heatmap', component: HeatmapComponent },
  { path: 'info', component: InfoComponent },
  { path: 'goal', component: GoalComponent },
  { path: 'memorize', component: MemorizeComponent },
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '',}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
