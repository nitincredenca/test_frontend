import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ManualInputService } from '../../core/services/manual-input.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent implements OnInit {
  clients: string[] = [];
  projects: string[] = [];
  filteredClients: string[] = [];
  filteredProjects: string[] = [];
  selectedClient: string = '';
  selectedProject: string = '';
  clientSearchQuery: string = '';
  projectSearchQuery: string = '';
  showClientDropdown: boolean = false;
  showProjectDropdown: boolean = false;

  constructor(
    private manualInputService: ManualInputService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.manualInputService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.filteredClients = [...clients];
      },
      error: (err) => console.error('Failed to load clients:', err)
    });
  }

  filterClients() {
    if (!this.clientSearchQuery) {
      this.filteredClients = [...this.clients];
    } else {
      this.filteredClients = this.clients.filter(client =>
        client.toLowerCase().includes(this.clientSearchQuery.toLowerCase())
      );
    }
  }

  filterProjects() {
    if (!this.projectSearchQuery) {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter(project =>
        project.toLowerCase().includes(this.projectSearchQuery.toLowerCase())
      );
    }
  }

  selectClient(client: string) {
    this.selectedClient = client;
    this.clientSearchQuery = client;
    this.showClientDropdown = false;
    this.loadProjects(client);
  }

  selectProject(project: string) {
    this.selectedProject = project;
    this.projectSearchQuery = project;
    this.showProjectDropdown = false;
  }

  onClientBlur() {
    setTimeout(() => {
      this.showClientDropdown = false;
      // If no client is selected but there's text in search, clear it
      if (!this.selectedClient && this.clientSearchQuery) {
        this.clientSearchQuery = '';
        this.filterClients();
      }
    }, 200);
  }

  onProjectBlur() {
    setTimeout(() => {
      this.showProjectDropdown = false;
      // If no project is selected but there's text in search, clear it
      if (!this.selectedProject && this.projectSearchQuery) {
        this.projectSearchQuery = '';
        this.filterProjects();
      }
    }, 200);
  }

  loadProjects(client: string) {
    this.projects = [];
    this.filteredProjects = [];
    this.selectedProject = '';
    this.projectSearchQuery = '';

    if (client) {
      this.manualInputService.getProjects(client).subscribe({
        next: (projects) => {
          this.projects = projects;
          this.filteredProjects = [...projects];
        },
        error: (err) => console.error('Failed to load projects:', err)
      });
    }
  }

  navigateToManualInput() {
    if (!this.selectedClient || !this.selectedProject) {
      console.warn('Cannot navigate - client or project not selected');
      return;
    }

    this.router.navigate(['/manual-input'], {
      queryParams: {
        client: this.selectedClient,
        project: this.selectedProject
      }
    }).catch(err => {
      console.error('Navigation error:', err);
    });
  }
}