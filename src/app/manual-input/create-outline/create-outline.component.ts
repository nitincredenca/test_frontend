import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { ManualInputService } from '../../core/services/manual-input.service';
import { BackendOutlineItem, ManualInputService, OutlineResponse } from '../../core/services/manual-input.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import Swal from 'sweetalert2';
import { SafeHtmlPipe } from '../../core/pipes/safe-html.pipe';


@Component({
  selector: 'app-create-outline',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './create-outline.component.html',
  styleUrl: './create-outline.component.css'
})
export class CreateOutlineComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private manualInputService: ManualInputService
  ) { }

  client = '';
  project = '';
  modules: string[] = [];
  availableFiles: string[] = [];
  selectedFiles: string[] = [];
  // selectedModule = '';
  selectedModule = 'project-level';

  topics = '';
  contextPrompt = '';

  outlines: any[] = [];
  currentIndex = 0;
  isLoading = false;
  isGenerating = false;
  isDownloading = false;
  isSaving = false;
  currentImages: string[] = [];


  projectLevelFiles: string[] = [];
  moduleLevelFiles: string[] = [];

  uploadedFiles: File[] = [];
  isUploading = false;


  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.client = params['client'] || '';
      this.project = params['project'] || '';
      this.getModules();
      this.loadProjectFiles(); // Add this line

      this.getOutline();
    });
  }
  // Add this method to your component.ts file
  getFileNames(): string {
    if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
      return '';
    }

    // Show individual file names instead of just count
    if (this.uploadedFiles.length === 1) {
      return this.uploadedFiles[0].name;
    } else {
      // For multiple files, show the first file name + count of others
      return `${this.uploadedFiles[0].name} +${this.uploadedFiles.length - 1} more`;
    }
  }


  handleFileUpload(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadedFiles = Array.from(files);
    }
  }


  clearFileUpload(): void {
    this.uploadedFiles = [];
    const fileInput = document.getElementById('file-upload-outline') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // uploadFiles(): void {

  //   if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
  //     this.showErrorToast('No files have been selected.');
  //     return;
  //   }

  //   this.isUploading = true;

  //   const formData = new FormData();
  //   for (let i = 0; i < this.uploadedFiles.length; i++) {
  //     formData.append('files', this.uploadedFiles[i]);
  //   }
  //   formData.append('client', this.client);
  //   formData.append('project', this.project);
  //   formData.append('module', this.selectedModule);

  //   this.manualInputService.uploadSourceFiles(formData).subscribe({
  //     next: (response: any) => {
  //       this.isUploading = false;
  //       this.showSuccessToast('Files uploaded successfully!');
  //       this.clearFileUpload();

  //       if (this.selectedModule) {
  //         this.loadModuleFiles();
  //       } else {
  //         this.loadProjectFiles();
  //       }
  //     },
  //     error: (err) => {
  //       this.isUploading = false;
  //       console.error('Error uploading files:', err);
  //       const errorMessage = err.error?.detail || 'Failed to upload files. Please try again.';
  //       this.showErrorToast(errorMessage);
  //     }
  //   });
  // }
  uploadFiles(): void {
    if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
      this.showErrorToast('No files have been selected.');
      return;
    }

    this.isUploading = true;

    const formData = new FormData();
    for (let i = 0; i < this.uploadedFiles.length; i++) {
      formData.append('files', this.uploadedFiles[i]);
    }
    formData.append('client', this.client);
    formData.append('project', this.project);

    // Use empty string for module when "project-level" is selected
    const moduleValue = this.selectedModule === 'project-level' ? '' : this.selectedModule;
    formData.append('module', moduleValue);

    this.manualInputService.uploadSourceFiles(formData).subscribe({
      next: (response: any) => {
        this.isUploading = false;
        this.showSuccessToast('Files uploaded successfully!');
        this.clearFileUpload();

        if (this.selectedModule && this.selectedModule !== 'project-level') {
          this.loadModuleFiles();
        } else {
          this.loadProjectFiles();
        }
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Error uploading files:', err);
        const errorMessage = err.error?.detail || 'Failed to upload files. Please try again.';
        this.showErrorToast(errorMessage);
      }
    });
  }


  private logFiles(source: string, files: string[]) {
    console.log(`[${source}] Files:`, files);
  }


  loadProjectFiles() {
    if (!this.client || !this.project) return;

    console.log(`Loading project files for ${this.client}/${this.project}`);
    this.manualInputService.getFiles(this.client, this.project, '').subscribe({
      next: (files) => {
        this.projectLevelFiles = files;
        this.logFiles('Project Level', files);
        this.updateAvailableFiles();
      },
      error: (err) => {
        console.error('Error loading project files:', err);
        this.showErrorToast('Failed to load project files. Please try again.');
      }
    });
  }

  // onModuleChange() {
  //   console.log('Module changed to:', this.selectedModule);
  //   if (!this.selectedModule) {
  //     this.moduleLevelFiles = [];
  //     this.updateAvailableFiles();
  //     return;
  //   }
  //   this.loadModuleFiles();
  // }
  onModuleChange() {
    console.log('Module changed to:', this.selectedModule);

    if (this.selectedModule === 'project-level') {
      // When "Project Level" is selected, show project-level files
      this.updateAvailableFiles();
    } else {
      // When a specific module is selected, load module files
      this.loadModuleFiles();
    }
  }

  loadModuleFiles() {
    if (!this.client || !this.project || !this.selectedModule) return;

    console.log(`Loading module files for ${this.client}/${this.project}/${this.selectedModule}`);
    this.manualInputService.getFiles(this.client, this.project, this.selectedModule).subscribe({
      next: (files) => {
        this.moduleLevelFiles = files;
        this.logFiles('Module Level', files);
        this.updateAvailableFiles();
      },
      error: (err) => {
        console.error('Error loading module files:', err);
        this.showErrorToast('Failed to load module files. Please try again.');
      }
    });
  }

  getFiles() {
    if (!this.client || !this.project || !this.selectedModule) return;

    this.manualInputService.getFiles(this.client, this.project, this.selectedModule).subscribe({
      next: (files) => {
        this.availableFiles = files;
      },
      error: (err) => {
        console.error('Error loading files:', err);
        this.showErrorToast('Failed to load files. Please try again.');
      }
    });
  }
  // updateAvailableFiles() {
  //   if (this.selectedModule) {
  //     // Only show module-level files when a module is selected
  //     this.availableFiles = [...this.moduleLevelFiles];
  //   } else {
  //     // Show project-level files when no module is selected
  //     this.availableFiles = [...this.projectLevelFiles];
  //   }
  //   this.logFiles('Available Files', this.availableFiles);
  // }
  updateAvailableFiles() {
    if (this.selectedModule && this.selectedModule !== 'project-level') {
      // Show module-level files when a specific module is selected
      this.availableFiles = [...this.moduleLevelFiles];
    } else {
      // Show project-level files when "Project Level" is selected or no module
      this.availableFiles = [...this.projectLevelFiles];
    }
    this.logFiles('Available Files', this.availableFiles);
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  get currentOutline(): any {
    if (this.outlines.length > 0) {
      // Update current images whenever outline changes
      this.currentImages = this.outlines[this.currentIndex]?.images_base64 || [];
      return this.outlines[this.currentIndex];
    }
    return null;
  }


  getModules() {
    if (!this.client || !this.project) return;

    this.manualInputService.getModules(this.client, this.project).subscribe({
      next: (modules) => {
        this.modules = modules;
      },
      error: (err) => {
        console.error('Error loading modules:', err);
        this.showErrorToast('Failed to load modules. Please try again.');
      }
    });
  }



  // canGenerateOutline(): boolean {
  //   // Module is mandatory
  //   if (!this.selectedModule) return false;

  //   // Either files must be selected OR files must be uploaded
  //   const hasSelectedFiles = this.selectedFiles && this.selectedFiles.length > 0;
  //   const hasUploadedFiles = this.uploadedFiles && this.uploadedFiles.length > 0;
  //   if (!hasSelectedFiles && !hasUploadedFiles) return false;

  //   // Both topics and context prompt are optional now
  //   return !this.isGenerating;
  // }
  canGenerateOutline(): boolean {
    // Module is mandatory - accept "project-level" as valid
    if (!this.selectedModule) return false;

    // Either files must be selected OR files must be uploaded
    const hasSelectedFiles = this.selectedFiles && this.selectedFiles.length > 0;
    const hasUploadedFiles = this.uploadedFiles && this.uploadedFiles.length > 0;
    if (!hasSelectedFiles && !hasUploadedFiles) return false;

    // Both topics and context prompt are optional now
    return !this.isGenerating;
  }


  // submitOutline() {
  //   Swal.fire({
  //     title: 'Generate Outline?',
  //     text: 'This will create a new outline based on your inputs.',
  //     icon: 'question',
  //     showCancelButton: true,
  //     confirmButtonColor: '#111111',
  //     cancelButtonColor: '#111111',
  //     confirmButtonText: 'Yes',
  //     cancelButtonText: 'Cancel',
  //     background: '#fff',
  //     color: '#111111',
  //     customClass: {
  //       confirmButton: 'swal-confirm-button',
  //       cancelButton: 'swal-cancel-button'
  //     }
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       if (!this.canGenerateOutline()) {
  //         this.showErrorToast('Please select a module and files');
  //         return;
  //       }

  //       this.isGenerating = true;

  //       const requestData = {
  //         client: this.client,
  //         project: this.project,
  //         module: this.selectedModule,
  //         files: this.selectedFiles,
  //         topics: this.topics ? this.topics.split('\n').filter(topic => topic.trim()) : [],
  //         context_prompt: this.contextPrompt || ''
  //       };

  //       this.manualInputService.submitOutline(requestData).subscribe({
  //         next: (response: BackendOutlineItem[]) => {
  //           if (response && response.length > 0) {
  //             this.outlines = response;
  //             this.showSuccessToast('Outline generated successfully!');
  //             this.autoSaveOutline();
  //           } else {
  //             this.showErrorToast('No content was found for the given inputs.');
  //           }
  //           this.isGenerating = false;
  //         },
  //         error: (err) => {
  //           console.error('Error generating outline:', err);
  //           this.isGenerating = false;
  //           this.showErrorToast('Failed to generate outline. Please try again.');
  //         }
  //       });
  //     }
  //   });
  // }
  submitOutline() {
    Swal.fire({
      title: 'Generate Outline?',
      text: 'This will create a new outline based on your inputs.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#111111',
      cancelButtonColor: '#111111',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      background: '#fff',
      color: '#111111',
      customClass: {
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        if (!this.canGenerateOutline()) {
          this.showErrorToast('Please select a module and files');
          return;
        }

        this.isGenerating = true;

        // Use empty string for module when "project-level" is selected
        const moduleValue = this.selectedModule === 'project-level' ? '' : this.selectedModule;

        const requestData = {
          client: this.client,
          project: this.project,
          module: moduleValue, // This will be empty string for project level
          files: this.selectedFiles,
          topics: this.topics ? this.topics.split('\n').filter(topic => topic.trim()) : [],
          context_prompt: this.contextPrompt || ''
        };

        this.manualInputService.submitOutline(requestData).subscribe({
          next: (response: BackendOutlineItem[]) => {
            if (response && response.length > 0) {
              this.outlines = response;
              this.showSuccessToast('Outline generated successfully!');
              this.autoSaveOutline();
            } else {
              this.showErrorToast('No content was found for the given inputs.');
            }
            this.isGenerating = false;
          },
          error: (err) => {
            console.error('Error generating outline:', err);
            this.isGenerating = false;
            this.showErrorToast('Failed to generate outline. Please try again.');
          }
        });
      }
    });
  }

  // nextOutline() {
  //   if (this.currentIndex < this.outlines.length - 1) {
  //     this.currentIndex++;
  //   }
  // }
  nextOutline() {
    if (this.currentIndex < this.outlines.length - 1) {
      this.currentIndex++;
      this.updateEditableContent();
    }
  }

  prevOutline() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateEditableContent();
    }
  }

  private updateEditableContent(): void {
    if (this.isEditing) {
      // Update editable fields with new current outline values
      this.editableFields = {
        'File': this.currentOutline.File || '',
        'Source Page': this.currentOutline['Source Page'] || '',
        'Chapter': this.currentOutline.Chapter || '',
        'Topic': this.currentOutline.Topic || '',
        'Subtopic': this.currentOutline.Subtopic || '',
        'Durations (Mins)': this.currentOutline['Durations (Mins)'] || ''
      };
      // Update the Full Page Content editable div
      this.editableContent = this.markdownToCleanHtml(this.currentOutline['Full Page Content'] || '');
      // Use setTimeout to ensure the DOM is updated before we manipulate it
      setTimeout(() => {
        if (this.contentEditableDiv) {
          this.contentEditableDiv.nativeElement.innerHTML = this.editableContent;
        }
      });
    }
  }

  getOutline() {
    this.isLoading = true;
    this.manualInputService.getOutline().subscribe({
      next: (response) => {
        this.outlines = Array.isArray(response) ? response : [response];
        this.currentIndex = 0;
        this.isLoading = false;
        console.log('Latest outline loaded:', this.outlines);
      },
      error: (err) => {
        console.error('Error loading outline:', err);
        this.isLoading = false;
        this.showErrorToast('Failed to load outline. Please try again.');
      }
    });
  }


  // downloadOutline() {
  //   if (!this.outlines || this.outlines.length === 0) return;

  //   Swal.fire({
  //     title: 'Download Outline?',
  //     text: 'Do you want to download the outline summary document?',
  //     icon: 'question',
  //     showCancelButton: true,
  //     confirmButtonColor: '#111111',
  //     cancelButtonColor: '#111111',
  //     confirmButtonText: 'Yes',
  //     cancelButtonText: 'Cancel',
  //     background: '#fff',
  //     color: '#111111',
  //     customClass: {
  //       confirmButton: 'swal-confirm-button',
  //       cancelButton: 'swal-cancel-button'
  //     }
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       this.isDownloading = true;

  //       // Create payload with client, project, and module
  //       const payload = {
  //         client: this.client,
  //         project: this.project,
  //         module: this.selectedModule
  //       };

  //       const clientShortName = this.getClientShortName(this.client);
  //       const moduleName = this.selectedModule.replace(/\s+/g, '');
  //       const docType = 'CO';
  //       const filename = `${clientShortName}_${moduleName}_${docType}.docx`;

  //       console.log('Payload being sent:', payload); // For debugging

  //       this.manualInputService.downloadOutline(payload).subscribe({
  //         next: (response) => {
  //           const blob = new Blob([response], {
  //             type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  //           });
  //           const url = window.URL.createObjectURL(blob);
  //           const a = document.createElement('a');
  //           a.href = url;
  //           a.download = filename;
  //           a.click();
  //           window.URL.revokeObjectURL(url);
  //           this.isDownloading = false;
  //           this.showSuccessToast('Your outline summary has been downloaded.');
  //         },
  //         error: (err) => {
  //           console.error('❌ Error downloading file:', err);
  //           this.isDownloading = false;
  //           this.showErrorToast('Failed to download the outline. Please try again.');
  //         }
  //       });
  //     }
  //   });
  // }


  //new raj
    downloadOutline() {
    if (!this.outlines || this.outlines.length === 0) return;
 
    Swal.fire({
      title: 'Download Outline?',
      text: 'Do you want to download the outline summary document?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#111111',
      cancelButtonColor: '#111111',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      background: '#fff',
      color: '#111111',
      customClass: {
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDownloading = true;
 
        // Fixed mapping to match backend expectations
        const formattedOutlines = this.outlines.map(outline => ({
          File: outline.File || '',
          Source_Page: outline['Source Page'] || '', // Map display name to backend field
          Chapter: outline.Chapter || '',
          Topic: outline.Topic || '',
          Subtopic: outline.Subtopic || '',
          Full_Page_Content: outline['Full Page Content'] || '', // Map display name to backend field
          Durations_min: outline['Durations (Mins)'] || '' // Map display name to backend field
        }));
 
        // Create complete payload with all required fields
        const payload = {
          client: this.client,
          project: this.project,
          module: this.selectedModule,
          outlines: formattedOutlines, // Fixed: Include outlines data
          context_prompt: this.contextPrompt || '', // Fixed: Include context prompt
          topic: this.topics || '' // Fixed: Include topic
        };
 
        const clientShortName = this.getClientShortName(this.client);
        const moduleName = this.selectedModule.replace(/\s+/g, '');
        const docType = 'CO';
        const filename = `${clientShortName}_${moduleName}_${docType}.docx`;
 
        console.log('Complete download payload being sent:', payload); // Enhanced debugging
 
        this.manualInputService.downloadOutline(payload).subscribe({
          next: (response) => {
            const blob = new Blob([response], {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            this.isDownloading = false;
            this.showSuccessToast('Your outline summary has been downloaded.');
          },
          error: (err) => {
            console.error('❌ Error downloading file:', err);
            this.isDownloading = false;
            this.showErrorToast('Failed to download the outline. Please try again.');
          }
        });
      }
    });
  }
 










  private getClientShortName(clientName: string): string {
    // Implement your logic to get short name from full client name
    // This is just an example - adjust based on your actual client naming conventions
    if (!clientName) return 'Unknown';

    // Example: "Apple Technologies" -> "APT"
    return clientName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3); // Take first 3 letters
  }
  fullPageContentInput: string = '';

  // private autoSaveOutline(): void {
  //   if (!this.outlines || this.outlines.length === 0) return;

  //   const formattedOutlines = this.outlines.map(outline => ({
  //     File: outline.File || '',
  //     Source_Page: outline['Source Page'] || '',
  //     Chapter: outline.Chapter || '',
  //     Topic: outline.Topic || '',
  //     Subtopic: outline.Subtopic || '',
  //     Full_Page_Content: outline['Full Page Content'] || '',
  //     Durations_min: outline['Durations (Mins)'] || ''

  //   }));

  //   const payload = {
  //     client: this.client,
  //     project: this.project,
  //     module: this.selectedModule,
  //     outlines: formattedOutlines,
  //     context_prompt: this.contextPrompt,
  //     topic: this.topics
  //   };

  //   this.manualInputService.saveOutline(payload).subscribe({
  //     next: (response) => {
  //       console.log('Outline auto-saved to backend');
  //       this.showSuccessToast('Outline saved to backend!');
  //     },
  //     error: (err) => {
  //       console.error('Error auto-saving outline:', err);
  //       this.showErrorToast('Outline generated but save failed. Please save manually.');
  //     }
  //   });
  // }

  //new raj
    private autoSaveOutline(): void {
    if (!this.outlines || this.outlines.length === 0) return;
 
    // Map frontend display names to backend field names
    const formattedOutlines = this.outlines.map(outline => ({
      File: outline.File || '',
      Source_Page: outline['Source Page'] || '',        // Map "Source Page" to "Source_Page"
      Chapter: outline.Chapter || '',
      Topic: outline.Topic || '',
      Subtopic: outline.Subtopic || '',
      Full_Page_Content: outline['Full Page Content'] || '', // Map "Full Page Content" to "Full_Page_Content"
      Durations_min: outline['Durations (Mins)'] || ''  // Map "Durations (Mins)" to "Durations_min"
    }));
 
    const payload = {
      client: this.client,
      project: this.project,
      module: this.selectedModule,
      outlines: formattedOutlines,
      context_prompt: this.contextPrompt,
      topic: this.topics
    };
 
    console.log('Auto-save payload field mapping check:', {
      originalOutlineFields: this.outlines.length > 0 ? Object.keys(this.outlines[0]) : [],
      mappedOutlineFields: formattedOutlines.length > 0 ? Object.keys(formattedOutlines[0]) : [],
      payload: payload
    });
 
    this.manualInputService.saveOutline(payload).subscribe({
      next: (response) => {
        console.log('Outline auto-saved to backend');
        this.showSuccessToast('Outline saved to backend!');
      },
      error: (err) => {
        console.error('Error auto-saving outline:', err);
        this.showErrorToast('Outline generated but save failed. Please save manually.');
      }
    });
  }
 

  //   private parseDuration(durationString: string): number {
  //   if (!durationString) return 0;

  //   const match = durationString.match(/(\d+)\s*min\s*(\d+)?\s*sec/);
  //   if (match) {
  //     const minutes = parseInt(match[1]) || 0;
  //     const seconds = parseInt(match[2]) || 0;
  //     return minutes + (seconds / 60);
  //   }
  //   return 0;
  // }
  private parseDuration(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }


  editableFields: { [key: string]: string } = {};


  saveEditing(): void {
    Swal.fire({
      title: 'Save Changes?',
      text: 'This will overwrite the current outline data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#111111',
      cancelButtonColor: '#111111',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      background: '#fff',
      color: '#111111',
      customClass: {
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSaving = true;

        // Update the current outline with edited values
        this.currentOutline.File = this.editableFields['File'];
        this.currentOutline['Source Page'] = this.editableFields['Source Page'];
        this.currentOutline.Chapter = this.editableFields['Chapter'];
        this.currentOutline.Topic = this.editableFields['Topic'];
        this.currentOutline.Subtopic = this.editableFields['Subtopic'];
        this.currentOutline['Durations (Mins)'] = this.editableFields['Durations (Mins)'];

        // Convert the editable HTML back to markdown for Full Page Content
        this.currentOutline['Full Page Content'] = this.cleanHtmlToMarkdown(this.editableContent);

        // Rest of your save logic remains the same...
        const formattedOutlines = this.outlines.map(outline => ({
          File: outline.File || '',
          Source_Page: outline['Source Page'] || '',
          Chapter: outline.Chapter || '',
          Topic: outline.Topic || '',
          Subtopic: outline.Subtopic || '',
          Full_Page_Content: outline['Full Page Content'] || '',
          Durations_min: outline['Durations (Mins)'] || ''

        }));

        const payload = {
          client: this.client,
          project: this.project,
          module: this.selectedModule,
          outlines: formattedOutlines,
          context_prompt: this.contextPrompt,
          topic: this.topics
        };

        console.log('Payload being sent to backend:', payload);


        this.manualInputService.saveOutline(payload).subscribe({
          next: (response) => {
            this.isEditing = false;
            this.originalOutline = null;
            this.editableContent = '';
            this.editableFields = {};
            this.isSaving = false;
            this.showSuccessToast('All changes saved and updated to backend!');
            console.log('Outline saved to backend:', response);
          },
          error: (err) => {
            console.error('Error saving outline:', err);
            this.isSaving = false;
            this.showErrorToast('Failed to save outline. Please try again.');
          }
        });
      }
    });
  }


  isEditing = false;
  originalOutline: any = null;
  referencesInput = ''
  editableContent: string = '';


  startEditing(): void {
    this.isEditing = true;
    this.originalOutline = JSON.parse(JSON.stringify(this.currentOutline));
    this.editableContent = this.markdownToCleanHtml(this.currentOutline['Full Page Content'] || '');

    // Initialize editable fields with current values
    this.editableFields = {
      'File': this.currentOutline.File || '',
      'Source Page': this.currentOutline['Source Page'] || '',
      'Chapter': this.currentOutline.Chapter || '',
      'Topic': this.currentOutline.Topic || '',
      'Subtopic': this.currentOutline.Subtopic || '',
      'Durations (Mins)': this.currentOutline['Durations (Mins)'] || ''
    };

    setTimeout(() => {
      this.contentEditableDiv.nativeElement.innerHTML = this.editableContent;
      this.contentEditableDiv.nativeElement.focus();

      const range = document.createRange();
      range.selectNodeContents(this.contentEditableDiv.nativeElement);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  }

  onFieldEdit(fieldName: string, event: Event): void {
    const target = event.target as HTMLElement;
    this.editableFields[fieldName] = target.innerText;
  }

  formatOutlineContent(content: string): string {
    if (!content) return 'N/A';

    // First handle images 
    let formatted = content.replace(
      /\[(?:TABLE IMAGE|Image)[^\]]*\]\((data:image\/[^;]+;base64,[^)]+)\)/g,
      (match, base64Data) => {
        return `<img src="${base64Data}" class="max-w-full h-auto my-2 border border-gray-200 rounded" />`;
      }
    );

    // Then handle tables with the improved table detection
    formatted = formatted.replace(
      /((?:^\|.*\|\r?\n?)+)/gm,
      (match) => {
        // Skip if this looks like an image pattern that was already processed
        if (match.includes('<img')) return match;
        return this.convertMarkdownTable(match.trim());
      }
    );

    // Then handle other markdown formatting
    formatted = formatted
      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-md font-bold mt-3 mb-1">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-sm font-bold mt-2 mb-1">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\d+\.\s+(.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^-\s+(.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br>');

    // Handle lists
    formatted = formatted.replace(/(<li.*?>.*?<\/li>)+/g,
      (match) => `<ul class="list-disc pl-5 mb-2">${match}</ul>`);

    return formatted;
  }

  private convertMarkdownTable(tableBlock: string): string {
    const lines = tableBlock.split(/\r?\n/).filter(l => l.trim().length > 0);

    if (lines.length < 2) return tableBlock; // not a real table

    // Header row
    const headers = lines[0].split("|")
      .map(h => h.trim())
      .filter(h => h && !h.match(/^:?-+:?$/)); // Filter out separator line if it got included

    // Find the separator line (contains ---)
    const separatorIndex = lines.findIndex(line => line.includes('---'));
    const bodyLines = separatorIndex >= 0 ? lines.slice(separatorIndex + 1) : lines.slice(1);

    // Get alignment from separator line if it exists
    let alignments: string[] = [];
    if (separatorIndex >= 0 && separatorIndex < lines.length) {
      alignments = lines[separatorIndex].split("|")
        .map(col => col.trim())
        .map(col => {
          const left = col.startsWith(':');
          const right = col.endsWith(':');
          return left && right ? 'center' : left ? 'left' : right ? 'right' : 'left';
        });
    }

    let html = `<div class="markdown-table-container"><table class="markdown-table"><thead><tr>`;
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += `</tr></thead><tbody>`;

    bodyLines.forEach(line => {
      const cells = line.split("|")
        .map(c => c.trim())
        .filter((c, i, arr) => i !== 0 || c !== '') // Filter empty first cell
        .filter((c, i, arr) => i !== arr.length - 1 || c !== ''); // Filter empty last cell

      if (cells.length > 0) {
        html += `<tr>`;
        cells.forEach((cell, i) => {
          const align = alignments[i] ? ` style="text-align: ${alignments[i]}"` : '';
          html += `<td${align}>${cell || ' '}</td>`;
        });
        html += `</tr>`;
      }
    });

    html += `</tbody></table></div>`;

    return html;
  }

  private parseMarkdownTable(header: string, separator: string, rows: string): string {
    const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
    const headerRow = `<thead><tr>${headerCells.map(cell => `<th>${cell}</th>`).join('')}</tr></thead>`;

    const alignments = separator.split('|').slice(1, -1).map(col => {
      const left = col.startsWith(':');
      const right = col.endsWith(':');
      return left && right ? 'center' : left ? 'left' : right ? 'right' : 'left';
    });

    const bodyRows = rows.split('\n').filter(row => row.trim()).map(row => {
      const cells = row.split('|').map(cell => cell.trim()).filter((cell, i, arr) => i > 0 && i < arr.length - 1);
      return `<tr>${cells.map((cell, i) => `<td style="text-align: ${alignments[i]}">${cell}</td>`).join('')}</tr>`;
    }).join('');

    return `${headerRow}<tbody>${bodyRows}</tbody>`;
  }

  cancelEditing(): void {
    this.isEditing = false;
    if (this.originalOutline) {
      Object.assign(this.currentOutline, this.originalOutline);
    }
    this.fullPageContentInput = '';
    this.referencesInput = '';
  }

  private markdownToCleanHtml(markdown: string): string {
    if (!markdown) return '';

    // Convert images
    let html = markdown.replace(
      /\[(?:TABLE IMAGE|Image)[^\]]*\]\((data:image\/[^;]+;base64,[^)]+)\)/g,
      (match, base64Data) => {
        return `<img src="${base64Data}" class="max-w-full h-auto my-2 border border-gray-200 rounded" />`;
      }
    );

    // Convert markdown tables
    html = html.replace(
      /^([^\n]*\|[^\n]*\n)((?:\s*:?-+:?\s*\|)+[^\n]*\n)((?:(?:[^\n]*\|[^\n]*)(?:\n|$))+)/gm,
      (match, header, separator, rows) => {
        return `<div class="markdown-table-container"><table class="markdown-table">${this.parseMarkdownTable(header, separator, rows)}</table></div>`;
      }
    );

    // Handle other markdown
    return html
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\d+\.\s+(.*$)/gm, '<li>$1</li>')
      .replace(/^-\s+(.*$)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }


  private cleanHtmlToMarkdown(html: string): string {
    if (!html) return '';

    // Convert images back
    let markdown = html.replace(
      /<img.*?src="(data:image\/[^;]+;base64,[^"]+)".*?>/g,
      '[Image]($1)'
    );

    // Convert HTML tables back to markdown
    markdown = markdown.replace(
      /<div class="markdown-table-container">.*?<table.*?>(.*?)<\/table>.*?<\/div>/gs,
      (match, tableContent) => {
        return this.convertHtmlTableToMarkdown(tableContent);
      }
    );

    // Handle other HTML
    return markdown
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<br>/g, '\n')
      .replace(/<\/?[^>]+(>|$)/g, '');
  }


  private convertHtmlTableToMarkdown(tableHtml: string): string {
    const doc = new DOMParser().parseFromString(tableHtml, 'text/html');
    const rows = Array.from(doc.querySelectorAll('tr'));

    let markdownTable = '';
    const headerCells = Array.from(rows[0].querySelectorAll('th, td')).map(cell => cell.textContent?.trim() || '');
    markdownTable += headerCells.join(' | ') + '\n';
    markdownTable += headerCells.map(() => '---').join(' | ') + '\n';

    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('td')).map(cell => cell.textContent?.trim() || '');
      markdownTable += cells.join(' | ') + '\n';
    }

    return markdownTable;
  }

  @ViewChild('contentEditableDiv') contentEditableDiv!: ElementRef;


  onContentEdit(event: Event): void {
    // Simply update the content without touching selection
    this.editableContent = this.contentEditableDiv.nativeElement.innerHTML;
  }



  getImageUrl(base64String: string): string {
    return `data:image/jpeg;base64,${base64String}`;
  }

  editOutline() {
    this.startEditing();
  }
  saveOutline() {
    if (this.isEditing) {
      this.saveEditing();
    }
  }

  private showErrorToast(message: string): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#fef2f2',
      iconColor: '#ef4444',
      color: '#111111'
    });
  }

  private showSuccessToast(message: string): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: '#f0fdf4',
      iconColor: '#22c55e',
      color: '#111111'
    });
  }

}


// downloadOutline() {
//   if (!this.outlines || this.outlines.length === 0) return;
//   Swal.fire({
//     title: 'Download Outline?',
//     text: 'Do you want to download the outline summary document?',
//     icon: 'question',
//     showCancelButton: true,
//     confirmButtonColor: '#22c55e',
//     cancelButtonColor: '#ef4444',
//     confirmButtonText: 'Yes, download it!',
//     background: '#fff'
//   }).then((result) => {
//     if (result.isConfirmed) {
//       this.isDownloading = true;
//       // Modified mapping to exactly match backend expectations
//       const formattedOutlines = this.outlines.map(outline => ({
//         File: outline.File || '',
//         'Source Page': outline['Source Page'] || '',
//         Chapter: outline.Chapter || '',
//         Topic: outline.Topic || '',
//         Subtopic: outline.Subtopic || '',
//         'Full Page Content': outline['Full Page Content'] || '',
//         'Durations (Mins)': outline['Durations (Mins)'] || '' // Exact match to UI field
//       }));
//       const payload = formattedOutlines;
//       const clientShortName = this.getClientShortName(this.client);
//       const moduleName = this.selectedModule.replace(/\s+/g, '');
//       const docType = 'CO';
//       const filename = `${clientShortName}_${moduleName}_${docType}.docx`;
//       console.log('Payload being sent:', payload); // For debugging
//       this.manualInputService.downloadOutline(payload).subscribe({
//         next: (response) => {
//           const blob = new Blob([response], {
//             type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//           });
//           const url = window.URL.createObjectURL(blob);
//           const a = document.createElement('a');
//           a.href = url;
//           a.download = filename;
//           a.click();
//           window.URL.revokeObjectURL(url);
//           this.isDownloading = false;
//           this.showSuccessToast('Your outline summary has been downloaded.');
//         },
//         error: (err) => {
//           console.error('❌ Error downloading file:', err);
//           this.isDownloading = false;
//           this.showErrorToast('Failed to download the outline. Please try again.');
//         }
//       });
//     }
//   });
// }


// prevOutline() {
//   if (this.currentIndex > 0) {
//     this.currentIndex--;
//   }
// }
// getVisiblePages(): number[] {
//   const total = this.outlines.length;
//   const current = this.currentIndex + 1;
//   const pages = [];

//   // Always show exactly 3 pages, centered around current page
//   let start = Math.max(1, current - 1);
//   let end = Math.min(total, current + 1);

//   // Adjust if we're at the beginning
//   if (current === 1) {
//     end = Math.min(total, 3);
//   }
//   // Adjust if we're at the end
//   else if (current === total) {
//     start = Math.max(1, total - 2);
//   }

//   for (let i = start; i <= end; i++) {
//     pages.push(i);
//   }

//   return pages;
// }

// shouldShowEllipsis(): boolean {
//   return this.outlines.length > 3 && (this.currentIndex + 1) < (this.outlines.length - 1);
// }

// goToPage(page: number): void {
//   this.currentIndex = page - 1;
// }

// Clear uploaded files
// clearFileUpload(): void {
//   this.uploadedFiles = [];
//   const fileInput = document.getElementById('file-upload-outline') as HTMLInputElement;
//   if (fileInput) {
//     fileInput.value = '';
//   }
// }
// File upload handler
// handleFileUpload(event: any): void {
//   const files = event.target.files;
//   if (files && files.length > 0) {
//     this.uploadedFiles = Array.from(files);
//   }
// }



// saveEditing(): void {
//   Swal.fire({
//     title: 'Save Changes?',
//     text: 'This will overwrite the current outline data.',
//     icon: 'warning',
//     showCancelButton: true,
//     confirmButtonColor: '#22c55e',
//     cancelButtonColor: '#ef4444',
//     confirmButtonText: 'Yes, save it!',
//     background: '#fff'
//   }).then((result) => {
//     if (result.isConfirmed) {
//       this.isSaving = true;
//       console.log('Raw editable HTML content before conversion:', this.editableContent);

//       const convertedMarkdown = this.cleanHtmlToMarkdown(this.editableContent);

//       // Convert the editable HTML back to markdown
//       this.currentOutline['Full Page Content'] = this.cleanHtmlToMarkdown(this.editableContent);

//       console.log('Converted markdown content:', convertedMarkdown);


//       const formattedOutlines = this.outlines.map(outline => ({
//         File: outline.File || '',
//         Source_Page: outline['Source Page'] || '',
//         Chapter: outline.Chapter || '',
//         Topic: outline.Topic || '',
//         Subtopic: outline.Subtopic || '',
//         Full_Page_Content: outline['Full Page Content'] || '',
//         Duration_min: this.parseDuration(outline['Durations (Mins)']) || 0
//       }));
//       console.log('Formatted outlines to be sent:');

//       console.log('Formatted outlines to be sent:');
//       formattedOutlines.forEach((outline, index) => {
//         console.log(`Outline ${index + 1}:`, {
//           ...outline,
//           // Truncate long content for better readability
//           Full_Page_Content: outline.Full_Page_Content
//             ? outline.Full_Page_Content.substring(0, 100) +
//             (outline.Full_Page_Content.length > 100 ? '...' : '')
//             : ''
//         });
//       });
//       const payload = {
//         client: this.client,
//         project: this.project,
//         module: this.selectedModule,
//         outlines: formattedOutlines
//       };

//       // Log the complete payload being sent to backend
//       console.log('Complete payload being sent to backend:', {
//         ...payload,
//         outlines: payload.outlines.map(outline => ({
//           ...outline,
//           // Truncate full page content in log for readability
//           Full_Page_Content: outline.Full_Page_Content
//             ? `[Content length: ${outline.Full_Page_Content.length} chars]`
//             : '[Empty]'
//         }))
//       });
//       this.manualInputService.saveOutline(payload).subscribe({
//         next: (response) => {
//           this.isEditing = false;
//           this.originalOutline = null;
//           this.editableContent = '';
//           this.isSaving = false;
//           this.showSuccessToast('All changes saved and updated to backend!');
//           console.log('Backend response:', response);
//           console.log('Successfully saved outline with content:', {
//             ...this.currentOutline,
//             Full_Page_Content: this.currentOutline['Full Page Content']
//               ? `[Content length: ${this.currentOutline['Full Page Content'].length} chars]`
//               : '[Empty]'
//           });
//         },
//         error: (err) => {
//           console.error('❌ Error saving outline:', err);
//           console.error('Error details:', {
//             payloadAttempted: payload,
//             errorResponse: err.error
//           });
//           this.isSaving = false;
//           this.showErrorToast('Failed to save outline. Please try again.');
//         }
//       });
//     }
//   });
// }

// startEditing(): void {
//   this.isEditing = true;
//   this.originalOutline = JSON.parse(JSON.stringify(this.currentOutline));
//   this.editableContent = this.markdownToCleanHtml(this.currentOutline['Full Page Content'] || '');

//   setTimeout(() => {
//     this.contentEditableDiv.nativeElement.innerHTML = this.editableContent; // ✅ set initial content
//     this.contentEditableDiv.nativeElement.focus();

//     const range = document.createRange();
//     range.selectNodeContents(this.contentEditableDiv.nativeElement);
//     range.collapse(false);
//     const selection = window.getSelection();
//     selection?.removeAllRanges();
//     selection?.addRange(range);
//   });
// }
// submitOutline() {
//   if (!this.canGenerateOutline()) {
//     this.showErrorToast('Please select a module and files');
//     return;
//   }

//   this.isGenerating = true;

//   const requestData = {
//     client: this.client,
//     project: this.project,
//     module: this.selectedModule,
//     files: this.selectedFiles,
//     topics: this.topics ? this.topics.split('\n').filter(topic => topic.trim()) : [],
//     context_prompt: this.contextPrompt || ''
//   };

//   this.manualInputService.submitOutline(requestData).subscribe({
//     next: (response: BackendOutlineItem[]) => {
//       if (response && response.length > 0) {
//         this.outlines = response;
//         this.showSuccessToast('Outline generated successfully!');
//         this.autoSaveOutline();
//       } else {
//         this.showErrorToast('No content was found for the given inputs.');
//       }
//       this.isGenerating = false;
//     },
//     error: (err) => {
//       console.error('Error generating outline:', err);
//       this.isGenerating = false;
//       this.showErrorToast('Failed to generate outline. Please try again.');
//     }
//   });
// }