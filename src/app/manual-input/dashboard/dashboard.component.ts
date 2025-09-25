import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  client = '';
  project = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.client = params['client'] || '';
      this.project = params['project'] || '';
    });
  }

  navigateTo(route: string) {
    this.router.navigate([`/manual-input/${route}`], {
      queryParams: {
        client: this.client,
        project: this.project
      }
    });
  }
}