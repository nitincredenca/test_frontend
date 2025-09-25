import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ManualInputService } from '../../core/services/manual-input.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

interface FileViewResponse {
  status: 'complete' | 'processing';
  url?: string;
}

// This interface matches the new object structure returned by your backend's /getfiles endpoint
// Example: { "Source": ["fileA.pptx"], "Outline": ["outline_v1.docx"] }
type FilesBySubfolder = Record<string, string[]>;


@Component({
  selector: 'app-view',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})

export class ViewComponent implements OnInit, OnDestroy {
  clients: string[] = [];
  projects: string[] = [];
  modules: string[] = [];
  files: FilesBySubfolder = {};

  selectedClient: string | null = null;
  selectedProject: string | null = null;
  selectedModule: string | null = null;
  selectedFile: { name: string, subfolder: string } | null = null;

  isLoadingFile = false;
  isProcessing = false;
  fileUrl: SafeResourceUrl | null = null;
  errorMessage: string | null = null;

  private pollingTimeout: any;

  constructor(
    private manualInputService: ManualInputService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.manualInputService.getClients().subscribe(data => this.clients = data);
  }

  onClientSelect(client: string): void {
    this.selectedClient = client;
    this.selectedProject = null; this.projects = [];
    this.selectedModule = null; this.modules = [];
    this.selectedFile = null; this.files = {};
    this.resetViewer();
    this.manualInputService.getProjects(client).subscribe(data => this.projects = data);
  }

  onProjectSelect(project: string): void {
    if (!this.selectedClient) return;
    this.selectedProject = project;
    this.selectedModule = null; this.modules = [];
    this.selectedFile = null; this.files = {};
    this.resetViewer();
    this.manualInputService.getModules(this.selectedClient, project).subscribe(data => this.modules = data);
  }

  onModuleSelect(module: string): void {
    if (!this.selectedClient || !this.selectedProject) return;
    this.selectedModule = module;
    this.selectedFile = null; this.files = {};
    this.resetViewer();
    this.manualInputService.getViewFiles(this.selectedClient, this.selectedProject, module).subscribe(data => this.files = data);
  }

  onFileSelect(fileName: string, subfolder: string): void {
    if (!this.selectedClient || !this.selectedProject || !this.selectedModule) return;
    this.selectedFile = { name: fileName, subfolder: subfolder };

    const fullPath = `${this.selectedClient}/${this.selectedProject}/${this.selectedModule}/${subfolder}/${fileName}`;
    this.startFileFetch(fullPath);
  }

  getSubfolders(): string[] {
    return Object.keys(this.files);
  }

  private startFileFetch(filePath: string): void {
    this.resetViewer();
    this.isLoadingFile = true;
    this.fetchUrl(filePath, 0);
  }

  private fetchUrl(filePath: string, attempt: number): void {
    const maxPollAttempts = 15;
    if (attempt >= maxPollAttempts) {
      this.handleError('File processing timed out.');
      return;
    }

    this.manualInputService.getFileViewUrl(filePath)
      .pipe(finalize(() => { this.isLoadingFile = false; }))
      .subscribe({
        next: (response) => {
          if (response.status === 'complete' && response.url) {
            this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.url);
          } else if (response.status === 'processing') {
            this.isProcessing = true;
            this.pollingTimeout = setTimeout(() => this.fetchUrl(filePath, attempt + 1), 4000);
          }
        },
        error: (err) => this.handleError(err.error?.detail || 'Could not load file.')
      });
  }

  private resetViewer(): void {
    this.isLoadingFile = false;
    this.isProcessing = false;
    this.errorMessage = null;
    this.fileUrl = null;
    clearTimeout(this.pollingTimeout);
  }

  private handleError(message: string): void {
    this.resetViewer();
    this.errorMessage = `Could not load ${this.selectedFile?.name || 'file'}. Reason: ${message}`;
  }

  ngOnDestroy(): void {
    clearTimeout(this.pollingTimeout);
  }
}