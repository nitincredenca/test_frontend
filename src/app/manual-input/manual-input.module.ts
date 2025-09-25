// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';



// @NgModule({
//   declarations: [],
//   imports: [
//     CommonModule
//   ]
// })
// export class ManualInputModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateOutlineComponent } from './create-outline/create-outline.component';
import { CreateStoryboardComponent } from './create-storyboard/create-storyboard.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
  { 
    path: '', 
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'create-outline', pathMatch: 'full' },
      { path: 'create-outline', component: CreateOutlineComponent },
      { path: 'create-storyboard', component: CreateStoryboardComponent },
      { path: 'view', component: ViewComponent }
    ]
  }
];

@NgModule({
  declarations: [], // No components declared here since they're standalone
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    // Import standalone components
    DashboardComponent,
    CreateOutlineComponent,
    CreateStoryboardComponent,
    ViewComponent
  ]
})
export class ManualInputModule { }