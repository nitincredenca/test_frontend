import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ManualInputService } from '../../core/services/manual-input.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import * as docx from 'docx';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-create-storyboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './create-storyboard.component.html',
  styleUrl: './create-storyboard.component.css'
})
export class CreateStoryboardComponent implements OnInit {
  client = '';
  project = '';
  availableOutlines: string[] = [];
  bloomsLevels: string[] = ['Level 1 - Remember', 'Level 2 - Understand', 'Level 3 - Apply'];
  // writingStyles: string[] = ['Narrative', 'Descriptive', 'Persuasive', 'Expository', 'Creative'];

  selectedOutline = '';
  bloomsLevel = '';
  selectedWritingStyle = '';
  userPrompt = '';
  isNASBA = false;
  isUKEnglish = false; // Add this new property

  outlineMetadata: any = null;
  outlineTopic: string = '';
  outlineUserPrompt: string = '';


  uploadedFile: File | null = null;
  uploadedFileName = '';
  isUploading = false;

  storyboards: any[] = [];
  currentIndex = 0;
  isLoading = false;
  isEditing = false;
  originalStoryboard: any = null;
  onScreenTextInput = '';
  recommendationsInput = '';
  isDownloading: any;
  isSaving: any;



  constructor(
    private route: ActivatedRoute,
    private manualInputService: ManualInputService,
    private cdr: ChangeDetectorRef

  ) { }
  styleGuideFileName: string = '';
  styleGuideFile: File | null = null;
  isUploadingStyleGuide = false;

  
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.client = params['client'] || '';
      this.project = params['project'] || '';
      this.getModules();
      // this.getStyleGuide();
      this.getStoryboard();

      if (params['outline']) {
        this.selectedOutline = params['outline'];

        setTimeout(() => {
          if (this.client && this.project && this.selectedModule && this.selectedOutline) {
            this.fetchOutlineMetadata();
          }
        }, 1000);
      }
    });
  }
  
  onOutlineChange(): void {
    if (this.selectedOutline && this.client && this.project && this.selectedModule) {
      this.fetchOutlineMetadata();
    } else {
      this.clearOutlineMetadata();
      this.contextPrompt = ''; // Clear context prompt when no outline is selected
    }
  }

  fetchOutlineMetadata(): void {
    this.manualInputService.getOutlineMetadata(
      this.client,
      this.project,
      this.selectedModule,
      this.selectedOutline
    ).subscribe({
      next: (response: any) => {
        this.outlineMetadata = response;

        this.outlineUserPrompt = response.user_prompt || '';

        if (this.outlineUserPrompt) {
          this.contextPrompt = this.outlineUserPrompt;
        } else {
          this.contextPrompt = ''; // Clear if no prompt exists
        }

        this.outlineTopic = '';

        this.showSuccessToast('Outline metadata loaded successfully!');
      },
      error: (err) => {
        console.error('Error fetching outline metadata:', err);
        this.clearOutlineMetadata();
        this.contextPrompt = ''; // Clear on error

        if (err.status !== 404) {
          this.showErrorToast('Failed to load outline metadata.');
        }
      }
    });
  }

  clearOutlineMetadata(): void {
    this.outlineMetadata = null;
    this.outlineTopic = ''; // Keep this for any existing usage, but it will be empty
    this.outlineUserPrompt = '';
  }



  getStyleGuide(): void {
    if (!this.client) return;

    this.manualInputService.getStyleGuide(this.client).subscribe({
      next: (response: any) => {
        if (response && response.file_name) {
          this.styleGuideFileName = response.file_name;
          console.log('Style guide loaded:', this.styleGuideFileName);
        } else {
          this.styleGuideFileName = '';
        }
      },
      error: (err) => {
        if (err.status === 404) {
          // Style guide not found, this is expected for new clients
          this.styleGuideFileName = '';
          console.log('No style guide found for client:', this.client);
        } else {
          console.error('Error loading style guide:', err);
          this.showErrorToast('Failed to load style guide.');
        }
      }
    });
  }

  triggerStyleGuideUpload(): void {
    document.getElementById('style-guide-upload')?.click();
  }

  handleStyleGuideUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        this.showErrorToast('Invalid file type. Please upload a PDF file.');
        this.clearStyleGuideUpload();
        return;
      }

      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        this.showErrorToast('File size too large. Maximum 20MB allowed.');
        this.clearStyleGuideUpload();
        return;
      }

      this.styleGuideFile = file;
      this.uploadStyleGuide();
    }
  }

  uploadStyleGuide(): void {
    if (!this.styleGuideFile || !this.client) {
      this.showErrorToast('No file selected or client not specified');
      return;
    }

    this.isUploadingStyleGuide = true;

    const formData = new FormData();
    formData.append('file', this.styleGuideFile);
    formData.append('client', this.client);

    this.manualInputService.uploadStyleGuide(formData).subscribe({
      next: (response: any) => {
        this.isUploadingStyleGuide = false;
        this.styleGuideFileName = response.file_name;
        this.showSuccessToast('Style guide uploaded successfully!');
        this.clearStyleGuideUpload();
        console.log('Style guide uploaded successfully:', response.file_name);
      },
      error: (err) => {
        this.isUploadingStyleGuide = false;
        console.error('Error uploading style guide:', err);
        const errorMessage = err.error?.detail || err.error?.message || 'Failed to upload style guide. Please try again.';
        this.showErrorToast(errorMessage);
        this.clearStyleGuideUpload();
      }
    });
  }

  clearStyleGuideUpload(): void {
    this.styleGuideFile = null;
    const input = document.getElementById('style-guide-upload') as HTMLInputElement;
    if (input) input.value = '';
  }


  showApplySection = false;

  // Toggle methods
  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.startEditing();
      this.showApplySection = false; // Hide apply section when editing
    } else {
      this.cancelEditing();
    }
  }

  toggleApplyMode(): void {
    this.showApplySection = !this.showApplySection;
    if (this.showApplySection) {
      this.isEditing = false; // Cancel editing if showing apply section
      this.cancelEditing();
    }
  }

  modules: string[] = [];
  selectedModule = '';

  // Add this method to load modules
  getModules() {
    if (!this.client || !this.project) return;

    this.manualInputService.getModules(this.client, this.project).subscribe({
      next: (modules) => {
        this.modules = modules;
      },
      error: (err) => {
        console.error('Error loading modules:', err);
      }
    });
  }
  onModuleChange() {
    if (this.selectedModule) {
      this.getOutlineList(); // Or filter outlines based on selected module
    }
  }

  getOutlineList() {
    if (!this.client || !this.project || !this.selectedModule) {
      console.error('Client, project, or module not available');
      return;
    }

    this.isLoading = true;
    this.manualInputService.getOutlineList(this.client, this.project, this.selectedModule).subscribe({
      next: (response: string[]) => {
        this.availableOutlines = response;
        this.isLoading = false;

        // Reset selected outline if it's not in the new list
        if (this.selectedOutline && !this.availableOutlines.includes(this.selectedOutline)) {
          this.selectedOutline = '';
          this.clearOutlineMetadata();
        } else if (this.selectedOutline) {
          // If the outline is still in the list, refresh its metadata
          this.fetchOutlineMetadata();
        }
      },
      error: (err) => {
        console.error('Error loading outlines:', err);
        this.showErrorToast('Failed to load outlines. Please try again.');
        this.isLoading = false;
      }
    });
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

  // handleFileUpload(event: any): void {
  //   const file = event.target.files[0];
  //   if (file) {
  //     // Validate file type
  //     const validTypes = ['application/pdf', 'application/msword',
  //       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  //       'text/plain'];
  //     if (!validTypes.includes(file.type)) {
  //       this.showErrorToast('Invalid file type. Please upload a DOC, DOCX, PDF or TXT file.');
  //       return;
  //     }

  //     // Validate file size (5MB max)
  //     if (file.size > 5 * 1024 * 1024) {
  //       this.showErrorToast('File size too large. Maximum 5MB allowed.');
  //       return;
  //     }

  //     this.uploadedFile = file;
  //     this.uploadedFileName = file.name;
  //     this.selectedOutline = ''; // Clear selected outline when file is uploaded
  //   }
  // }

  // new rajveer
  //   handleFileUpload(event: any): void {
  //   const file = event.target.files[0];
  //   if (file) {
  //     // --- UPDATED: Strict validation for DOCX files only ---
  //     const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  //     if (file.type !== docxMimeType) {
  //       // --- UPDATED: Specific error message for the user ---
  //       this.showErrorToast('Invalid file type. Please upload a DOCX file only.');
  //       this.clearFileUpload(); // Reset the input if the file is invalid
  //       return;
  //     }
  //     this.uploadedFile = file;
  //     this.uploadedFileName = file.name;
  //     this.selectedOutline = ''; // Clear dropdown selection when a new file is chosen
  //   }
  // }

  // damodar
  handleFileUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (file.type !== docxMimeType) {
        this.showErrorToast('Invalid file type. Please upload a DOCX file only.');
        this.clearFileUpload();
        return;
      }
      this.uploadedFile = file;
      this.uploadedFileName = file.name;
      this.selectedOutline = ''; // Clear dropdown selection when a new file is chosen
      this.clearOutlineMetadata(); // Clear any previously loaded metadata
      this.contextPrompt = ''; // Clear context prompt when uploading new file
    }
  }

  clearFileUpload(): void {
    this.uploadedFile = null;
    this.uploadedFileName = '';
    (document.getElementById('file-upload') as HTMLInputElement).value = '';
  }

  uploadOutline(): void {
    // Add a guard clause to ensure a module is selected first.
    if (!this.selectedModule) {
      this.showErrorToast('Please select a module before uploading.');
      return;
    }

    if (!this.uploadedFile) {
      this.showErrorToast('No DOCX file has been chosen.');
      return;
    }

    this.isUploading = true;

    const formData = new FormData();
    formData.append('file', this.uploadedFile);
    formData.append('client', this.client);
    formData.append('project', this.project);
    formData.append('module', this.selectedModule);

    this.manualInputService.uploadOutlineFile(formData).subscribe({
      next: (response: any) => {
        this.isUploading = false;
        this.showSuccessToast('File uploaded and saved to ADLS!');

        // Re-fetch the list from ADLS to get the most up-to-date data.
        this.getOutlineList();

        // For great UX, automatically select the file you just uploaded.
        this.selectedOutline = response.outlineName;

        // Fetch metadata for the newly uploaded outline
        setTimeout(() => {
          this.fetchOutlineMetadata();
        }, 500);

        // Clear the file input, making it ready for the next upload.
        this.clearFileUpload();
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Error uploading outline:', err);
        const errorMessage = err.error?.detail || 'Failed to upload outline. Please try again.';
        this.showErrorToast(errorMessage);
      }
    });
  }


  get currentStoryboard(): any {
    return this.storyboards.length > 0 ? this.storyboards[this.currentIndex] : null;
  }
  combinedOutlines: string[] = [];

  contextPrompt = '';

  canGenerate(): boolean {
    return !!this.styleGuideFileName &&
      !!this.selectedModule &&
      !!this.selectedOutline &&
      !!this.bloomsLevel &&
      !this.isLoading;
  }

 
  submitStoryboard() {
    Swal.fire({
      title: 'Generate Storyboard?',
      text: 'This will create a new storyboard based on your inputs.',
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
        if (!this.styleGuideFileName) {
          this.showErrorToast('Please upload a style guide');
          return;
        }

        if (!this.selectedModule) {
          this.showErrorToast('Please select a module');
          return;
        }

        if (!this.selectedOutline) {
          this.showErrorToast('Please select or upload an outline');
          return;
        }

        if (!this.bloomsLevel) {
          this.showErrorToast('Please select a Bloom\'s Taxonomy level');
          return;
        }

        this.isLoading = true;
        this.storyboards = [];
        this.currentIndex = 0;

        const requestData = {
          outline: this.selectedOutline,
          client: this.client,
          project: this.project,
          module: this.selectedModule,
          blooms_level: this.bloomsLevel,
          context_prompt: this.contextPrompt,
          compliance: {
            nasba: this.isNASBA,
            ukEnglish: this.isUKEnglish
          }
        };

        console.log('storyboard request data:', requestData);

        if (this.uploadedFile) {
          const formData = new FormData();
          formData.append('file', this.uploadedFile);
          Object.keys(requestData).forEach(key => {
            formData.append(key, (requestData as any)[key]);
          });

          this.manualInputService.generateStoryboardWithFile(formData).subscribe({
            next: () => {
              this.getStoryboard();
            },
            error: (err) => {
              console.error('Error generating storyboard:', err);
              this.showErrorToast('Failed to generate storyboard. Please try again.');
              this.isLoading = false;
            }
          });
        } else {
          this.manualInputService.submitStoryboard(requestData).subscribe({
            next: () => {
              this.getStoryboard();
            },
            error: (err) => {
              console.error('Error generating storyboard:', err);
              this.showErrorToast('Failed to generate storyboard. Please try again.');
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  learningObjectivesInput = '';
  developerNotesInput = '';
  sourceImagesInput = '';
  sourceImages: any[] = [];
  // newImages: { file: File, preview: string }[] = [];

  // Add these methods for image handling
  removeImage(index: number): void {
    if (this.sourceImages && this.sourceImages.length > index) {
      this.sourceImages.splice(index, 1);
    }
  }

  getField(obj: any, fieldName: string): any {
    return obj ? obj[fieldName] : null;
  }

  setField(fieldName: string, value: any): void {
    if (this.currentStoryboard) {
      this.currentStoryboard[fieldName] = value;
    }
  }

  getStoryboard() {
    this.manualInputService.getStoryboard().subscribe({
      next: (response: any) => {
        console.log("Backend response:", response);
        // Backend returns array of storyboards in new format
        this.storyboards = Array.isArray(response) ? response : [response];
        this.isLoading = false;
        this.showSuccessToast('Storyboard generated successfully!');
      },
      error: (err: any) => {
        console.error('Error fetching storyboard:', err);
        this.showErrorToast('Failed to load storyboard. Please try again.');
        this.isLoading = false;
      }
    });
  }


  nextStoryboard() {
    if (this.currentIndex < this.storyboards.length - 1) {
      this.currentIndex++;
    }
  }

  prevStoryboard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }


  getParagraphs(onScreenText: any): { key: string, value: string }[] {
    if (!onScreenText) return [];

    if (typeof onScreenText === 'string') {
      return [{ key: '1', value: onScreenText }];
    } else {
      return Object.entries(onScreenText).map(([key, value]) => ({
        key: key.split('_')[1],
        value: value as string
      }));
    }
  }


  startEditing(): void {
    this.isEditing = true;
    this.originalStoryboard = JSON.parse(JSON.stringify(this.currentStoryboard));

    // Set up text inputs for editing
    if (this.currentStoryboard.On_screen_text) {
      this.onScreenTextInput = this.currentStoryboard.On_screen_text;
    }

    if (this.currentStoryboard.On_screen_Recommendations) {
      this.recommendationsInput = Array.isArray(this.currentStoryboard.On_screen_Recommendations)
        ? this.currentStoryboard.On_screen_Recommendations.join('\n')
        : this.currentStoryboard.On_screen_Recommendations;
    }

    if (this.currentStoryboard.Learning_Objectives) {
      this.learningObjectivesInput = Array.isArray(this.currentStoryboard.Learning_Objectives)
        ? this.currentStoryboard.Learning_Objectives.join('\n')
        : this.currentStoryboard.Learning_Objectives;
    }

    if (this.currentStoryboard.Developer_Notes) {
      this.developerNotesInput = Array.isArray(this.currentStoryboard.Developer_Notes)
        ? this.currentStoryboard.Developer_Notes.join('\n')
        : this.currentStoryboard.Developer_Notes;
    }

    // Set up source images for editing
    const sourceImages = this.getField(this.currentStoryboard, 'Source_Images_(base64)');
    if (sourceImages) {
      this.sourceImages = Array.isArray(sourceImages) ? [...sourceImages] : [sourceImages];
    } else {
      this.sourceImages = [];
    }
  }

  cancelEditing(): void {
    this.isEditing = false;
    if (this.originalStoryboard) {
      Object.assign(this.currentStoryboard, this.originalStoryboard);
    }
    this.onScreenTextInput = '';
    this.recommendationsInput = '';
    this.learningObjectivesInput = '';
    this.developerNotesInput = '';
    this.sourceImages = [];
  }



  
  


  saveEditing(): void {
    Swal.fire({
      title: 'Save Changes?',
      text: 'This will overwrite all storyboard data with your changes.',
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
        this.finalizeSave();
      }
    });
  }

  // Add this new method to handle the actual saving logic
  finalizeSave(): void {
    // Update the current storyboard with the edited values
    const updatedStoryboards = [...this.storyboards];

    // Process on-screen text for current storyboard
    if (this.onScreenTextInput.trim()) {
      updatedStoryboards[this.currentIndex].On_screen_text = this.onScreenTextInput;
    }

    // Process recommendations for current storyboard
    if (this.recommendationsInput.trim()) {
      updatedStoryboards[this.currentIndex].On_screen_Recommendations = this.recommendationsInput
        .split('\n')
        .map(r => r.trim())
        .filter(r => r);
    } else {
      updatedStoryboards[this.currentIndex].On_screen_Recommendations = [];
    }

    // Process learning objectives for current storyboard
    if (this.learningObjectivesInput.trim()) {
      updatedStoryboards[this.currentIndex].Learning_Objectives = this.learningObjectivesInput
        .split('\n')
        .map(obj => obj.trim())
        .filter(obj => obj);
    } else {
      updatedStoryboards[this.currentIndex].Learning_Objectives = [];
    }

    // Process developer notes for current storyboard
    if (this.developerNotesInput.trim()) {
      updatedStoryboards[this.currentIndex].Developer_Notes = this.developerNotesInput
        .split('\n')
        .map(note => note.trim())
        .filter(note => note);
    } else {
      updatedStoryboards[this.currentIndex].Developer_Notes = [];
    }

    // Process source images for current storyboard
    updatedStoryboards[this.currentIndex]['Source_Images_(base64)'] = this.sourceImages.filter(img => img && img !== 'N/A');

    // Update other fields that are directly bound via ngModel
    updatedStoryboards[this.currentIndex].Topic = this.currentStoryboard.Topic || '';
    updatedStoryboards[this.currentIndex].Screen_type = this.currentStoryboard.Screen_type || '';
    updatedStoryboards[this.currentIndex]['Duration_(min)'] = this.currentStoryboard['Duration_(min)'] || '';
    updatedStoryboards[this.currentIndex].Narration = this.currentStoryboard.Narration || '';

    // Transform all storyboards for the payload - ADD MISSING FIELDS
    const transformedStoryboards = updatedStoryboards.map(sb => ({
      Course_Title: sb.Course_Title || '', // Added missing field
      Module_Title: sb.Module_Title || '', // Added missing field
      Topic: sb.Topic || '',
      Learning_Objectives: Array.isArray(sb.Learning_Objectives) ? sb.Learning_Objectives : [],
      Screen_type: sb.Screen_type || '',
      Blooms_Level: sb.Blooms_Level || 'N/A', // Added missing field with default
      'Duration_(min)': sb['Duration_(min)'] || '',
      'Source_Images_(base64)': Array.isArray(sb['Source_Images_(base64)']) ? sb['Source_Images_(base64)'] : [],
      On_screen_text: sb.On_screen_text || '',
      Narration: sb.Narration || '',
      On_screen_Recommendations: Array.isArray(sb.On_screen_Recommendations) ? sb.On_screen_Recommendations : [],
      Developer_Notes: Array.isArray(sb.Developer_Notes) ? sb.Developer_Notes : []
    }));

    const payload = {
      client: this.client,
      project: this.project,
      module: this.currentStoryboard.Module || 'default',
      storyboard: transformedStoryboards  // Send ALL storyboards, not just the current one
    };

    console.log('Saving all storyboards with payload:', payload);

    this.isSaving = true;
    this.manualInputService.saveStoryboard(payload).subscribe({
      next: () => {
        // Update the local storyboards with the changes
        this.storyboards = updatedStoryboards;

        this.isEditing = false;
        this.originalStoryboard = null;
        this.onScreenTextInput = '';
        this.recommendationsInput = '';
        this.learningObjectivesInput = '';
        this.developerNotesInput = '';
        this.sourceImages = [];
        this.isSaving = false;
        this.showSuccessToast('Storyboard saved successfully!');
      },
      error: (err) => {
        console.error('Error saving storyboard:', err);
        this.isSaving = false;
        this.showErrorToast('Failed to save storyboard. Please try again.');
      }
    });
  }

  downloadStoryboard() {
    Swal.fire({
      title: 'Download Storyboard?',
      text: 'This will download the storyboard as a Word document.',
      icon: 'info',
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
        if (!this.storyboards || this.storyboards.length === 0) return;

        this.isDownloading = true;

        const formattedStoryboards = this.storyboards.map(sb => ({
          Course_Title: sb.Course_Title || '', // Added missing field
          Module_Title: sb.Module_Title || '', // Added missing field
          Topic: sb.Topic,
          Learning_Objectives: Array.isArray(sb.Learning_Objectives)
            ? sb.Learning_Objectives.join('\n')
            : sb.Learning_Objectives,
          Screen_type: sb.Screen_type,
          Blooms_Level: sb.Blooms_Level || 'N/A', // Added missing field
          'Duration_(min)': sb['Duration_(min)'] || '',
          'Source_Images_(base64)': Array.isArray(sb['Source_Images_(base64)'])
            ? sb['Source_Images_(base64)'].join('\n')
            : sb['Source_Images_(base64)'],
          On_screen_text: sb.On_screen_text,
          Narration: sb.Narration,
          On_screen_Recommendations: Array.isArray(sb.On_screen_Recommendations)
            ? sb.On_screen_Recommendations.join('\n')
            : sb.On_screen_Recommendations,
          Developer_Notes: Array.isArray(sb.Developer_Notes)
            ? sb.Developer_Notes.join('\n')
            : sb.Developer_Notes
        }));

        const payload = { storyboards: formattedStoryboards };
        console.log('Sending storyboards for download:', payload);

        this.manualInputService.downloadStoryboard(payload).subscribe({
          next: (response) => {
            this.isDownloading = false;
            const blob = new Blob([response], {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.client}_${this.project}_storyboards.docx`;
            a.click();
            window.URL.revokeObjectURL(url);
          },
          error: (err) => {
            console.error('Error downloading storyboard:', err);
            this.isDownloading = false;
            this.showErrorToast('Failed to download the storyboard. Please try again.');
          }
        });
      }
    });
  }





  applyOption: 'current' | 'all' = 'current';
  modificationPrompt: string = '';
  isApplying: boolean = false;



  applyChanges(): void {
    Swal.fire({
      title: 'Apply Changes?',
      text: 'This will modify the storyboard based on your prompt.',
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
        if (!this.modificationPrompt) {
          this.showErrorToast('Please enter a modification prompt');
          return;
        }

        this.isApplying = true;

        const payload = {
          client: this.client,
          project: this.project,
          applyToAll: this.applyOption === 'all',
          prompt: this.modificationPrompt,
          ...(this.applyOption === 'current' && {
            pageNumber: this.currentIndex + 1
          })
        };

        console.log('Applying changes with payload:', payload);
        this.manualInputService.applyChanges(payload).subscribe({
          next: (response) => {
            this.isApplying = false;
            this.modificationPrompt = '';
            this.showSuccessToast(response.message || 'Changes applied successfully!');

            if (this.applyOption === 'all') {
              this.getStoryboard();
            }
          },
          error: (err) => {
            this.isApplying = false;
            console.error('Error applying changes:', err);
            this.showErrorToast('Failed to apply changes. Please try again.');
          }
        });
      }
    });
  }
}


    

    // cancelEditing(): void {
  //   this.isEditing = false;
  //   if (this.originalStoryboard) {
  //     Object.assign(this.currentStoryboard, this.originalStoryboard);
  //   }
  //   this.onScreenTextInput = '';
  //   this.recommendationsInput = '';
  // }
  // Simplify the cancelEditing method:
    
  // startEditing(): void {
  //   this.isEditing = true;
  //   this.originalStoryboard = JSON.parse(JSON.stringify(this.currentStoryboard));

  //   if (this.currentStoryboard.On_screen_text) {
  //     if (typeof this.currentStoryboard.On_screen_text === 'string') {
  //       this.onScreenTextInput = this.currentStoryboard.On_screen_text;
  //     } else {
  //       this.onScreenTextInput = Object.entries(this.currentStoryboard.On_screen_text)
  //         .map(([key, value]) => `Para ${key.split('_')[1]}: ${value}`)
  //         .join('\n\n');
  //     }
  //   }

  //   if (this.currentStoryboard.On_screen_Recommendations) {
  //     this.recommendationsInput = Array.isArray(this.currentStoryboard.On_screen_Recommendations)
  //       ? this.currentStoryboard.On_screen_Recommendations.join('\n')
  //       : this.currentStoryboard.On_screen_Recommendations;
  //   }
  // }
 


  // uploadOutline(): void {
  //   if (!this.uploadedFile) {
  //     this.showErrorToast('No file selected for upload');
  //     return;
  //   }

  //   this.isUploading = true;

  //   const formData = new FormData();
  //   formData.append('file', this.uploadedFile);
  //   formData.append('client', this.client);
  //   formData.append('project', this.project);

  //   this.manualInputService.uploadOutlineFile(formData).subscribe({
  //     next: (response: any) => {
  //       this.isUploading = false;
  //       this.showSuccessToast('Outline uploaded and processed successfully!');

  //       // 1. First clear the current selection
  //       this.selectedOutline = '';

  //       // 2. Add the new outline to the list
  //       this.availableOutlines = [response.outlineName, ...this.availableOutlines];

  //       // 3. Then set the new selection
  //       setTimeout(() => {
  //         this.getOutlineList();
  //       }, 100);

  //       // 4. Clear the file upload
  //       this.clearFileUpload();
  //     },
  //     error: (err) => {
  //       console.error('Error uploading outline:', err);
  //       this.isUploading = false;
  //       this.showErrorToast('Failed to upload outline. Please try again.');
  //     }
  //   });
  // }

  //new rajveer 
  //   uploadOutline(): void {
  //   // Add a guard clause to ensure a module is selected first.
  //   if (!this.selectedModule) {
  //     this.showErrorToast('Please select a module before uploading.');
  //     return;
  //   }

  //   if (!this.uploadedFile) {
  //     this.showErrorToast('No DOCX file has been chosen.');
  //     return;
  //   }

  //   this.isUploading = true;

  //   const formData = new FormData();
  //   formData.append('file', this.uploadedFile);
  //   formData.append('client', this.client);
  //   formData.append('project', this.project);
  //    formData.append('module', this.selectedModule);

  //   this.manualInputService.uploadOutlineFile(formData).subscribe({
  //     next: (response: any) => {
  //       this.isUploading = false;
  //       this.showSuccessToast('File uploaded and saved to ADLS!');

  //       // --- THE ROBUST "CONFIRMATION LOOP" ---
  //       // 1. Re-fetch the list from ADLS to get the most up-to-date data.
  //       this.getOutlineList();

  //       // 2. For great UX, automatically select the file you just uploaded.
  //       this.selectedOutline = response.outlineName;

  //       // 3. Clear the file input, making it ready for the next upload.
  //       this.clearFileUpload();
  //     },
  //     error: (err) => {
  //       this.isUploading = false;
  //       console.error('Error uploading outline:', err);
  //       const errorMessage = err.error?.detail || 'Failed to upload outline. Please try again.';
  //       this.showErrorToast(errorMessage);
  //     }
  //   });
  // }




  //  submitStoryboard() {
  //   // Validate mandatory fields
  //   if (!this.styleGuideFileName) {
  //     this.showErrorToast('Please upload a style guide');
  //     return;
  //   }

  //   if (!this.selectedModule) {
  //     this.showErrorToast('Please select a module');
  //     return;
  //   }

  //   if (!this.selectedOutline) {
  //     this.showErrorToast('Please select or upload an outline');
  //     return;
  //   }

  //   if (!this.bloomsLevel) {
  //     this.showErrorToast('Please select a Bloom\'s Taxonomy level');
  //     return;
  //   }

  //   this.isLoading = true;
  //   this.storyboards = [];
  //   this.currentIndex = 0;

  //   const requestData = {
  //     outline: this.selectedOutline,
  //     client: this.client,
  //     project: this.project,
  //     module: this.selectedModule,
  //     blooms_level: this.bloomsLevel,
  //     context_prompt: this.contextPrompt,
  //     compliance: {
  //       nasba: this.isNASBA,
  //       ukEnglish: this.isUKEnglish
  //     }
  //   };

  //   console.log('storyboard request data:', requestData);

  //   // If file was uploaded, include it in the request
  //   if (this.uploadedFile) {
  //     const formData = new FormData();
  //     formData.append('file', this.uploadedFile);
  //     Object.keys(requestData).forEach(key => {
  //       formData.append(key, (requestData as any)[key]);
  //     });

  //     this.manualInputService.generateStoryboardWithFile(formData).subscribe({
  //       next: () => {
  //         this.getStoryboard();
  //       },
  //       error: (err) => {
  //         console.error('Error generating storyboard:', err);
  //         this.showErrorToast('Failed to generate storyboard. Please try again.');
  //         this.isLoading = false;
  //       }
  //     });
  //   } else {
  //     // Original implementation for selected outline
  //     this.manualInputService.submitStoryboard(requestData).subscribe({
  //       next: () => {
  //         this.getStoryboard();
  //       },
  //       error: (err) => {
  //         console.error('Error generating storyboard:', err);
  //         this.showErrorToast('Failed to generate storyboard. Please try again.');
  //         this.isLoading = false;
  //       }
  //     });
  //   }
  // }

  // submitStoryboard() {


  //   this.isLoading = true;
  //   this.storyboards = [];
  //   this.currentIndex = 0;

  //   const requestData = {
  //     outline: this.selectedOutline,
  //     client: this.client,
  //     project: this.project,
  //     module: this.selectedModule, // Add this line
  //     blooms_level: this.bloomsLevel,
  //           context_prompt: this.contextPrompt, // Add context prompt to request

  //     compliance: {
  //       nasba: this.isNASBA,
  //       ukEnglish: this.isUKEnglish // Add UK English flag to compliance

  //     }
  //   };
  //   console.log('storyboard request data:', requestData);

  //   // If file was uploaded, include it in the request
  //   if (this.uploadedFile) {
  //     const formData = new FormData();
  //     formData.append('file', this.uploadedFile);
  //     Object.keys(requestData).forEach(key => {
  //       formData.append(key, (requestData as any)[key]);
  //     });

  //     this.manualInputService.generateStoryboardWithFile(formData).subscribe({
  //       next: () => {
  //         this.getStoryboard();
  //       },
  //       error: (err) => {
  //         console.error('Error generating storyboard:', err);
  //         this.showErrorToast('Failed to generate storyboard. Please try again.');
  //         this.isLoading = false;
  //       }
  //     });
  //   } else {
  //     // Original implementation for selected outline
  //     this.manualInputService.submitStoryboard(requestData).subscribe({
  //       next: () => {
  //         this.getStoryboard();
  //       },
  //       error: (err) => {
  //         console.error('Error generating storyboard:', err);
  //         this.showErrorToast('Failed to generate storyboard. Please try again.');
  //         this.isLoading = false;
  //       }
  //     });
  //   }
  // }

  // getStoryboard() {
  //   this.manualInputService.getStoryboard().subscribe({
  //     next: (response: any) => {
  //       this.storyboards = Array.isArray(response) ? response : [response];
  //       this.isLoading = false;
  //       this.showSuccessToast('Storyboard generated successfully!');
  //     },
  //     error: (err: any) => {
  //       console.error('Error fetching storyboard:', err);
  //       this.showErrorToast('Failed to load storyboard. Please try again.');
  //       this.isLoading = false;
  //     }
  //   });
  // }


  // removeNewImage(index: number): void {
  //   if (this.newImages && this.newImages.length > index) {
  //     this.newImages.splice(index, 1);
  //   }
  // }
  // onImageUpload(event: any): void {
  //   const files = event.target.files;
  //   if (files && files.length > 0) {
  //     for (let i = 0; i < files.length; i++) {
  //       const file = files[i];
  //       if (file.type.match('image.*')) {
  //         const reader = new FileReader();
  //         reader.onload = (e: any) => {
  //           this.newImages.push({
  //             file: file,
  //             preview: e.target.result
  //           });
  //         };
  //         reader.readAsDataURL(file);
  //       }
  //     }
  //   }
  //   event.target.value = ''; // Reset file input
  // }

  // saveEditing(): void {
  //   // Process on-screen text
  //   if (this.onScreenTextInput.trim()) {
  //     const lines = this.onScreenTextInput.split('\n\n');
  //     if (lines.length > 1) {
  //       this.currentStoryboard.On_screen_text = {};
  //       lines.forEach((line, index) => {
  //         const match = line.match(/^Para (\d+):\s*(.*)/);
  //         if (match) {
  //           this.currentStoryboard.On_screen_text[`para_${match[1]}`] = match[2];
  //         } else {
  //           this.currentStoryboard.On_screen_text[`para_${index + 1}`] = line;
  //         }
  //       });
  //     } else {
  //       this.currentStoryboard.On_screen_text = this.onScreenTextInput;
  //     }
  //   }

  //   if (this.recommendationsInput.trim()) {
  //     this.currentStoryboard.On_screen_Recommendations = this.recommendationsInput
  //       .split('\n')
  //       .map(r => r.trim())
  //       .filter(r => r);
  //   } else {
  //     this.currentStoryboard.On_screen_Recommendations = [];
  //   }

  //   const transformedStoryboard = {
  //     Topic: this.currentStoryboard.Topic || '',
  //     Learning_Objectives: this.currentStoryboard.Learning_Objectives || '',
  //     Screen_type: this.currentStoryboard.Screen_type || '',
  //     On_screen_text: typeof this.currentStoryboard.On_screen_text === 'string'
  //       ? this.currentStoryboard.On_screen_text
  //       : Object.values(this.currentStoryboard.On_screen_text).join('\n\n'),
  //     Narration: this.currentStoryboard.Narration || '',
  //     On_screen_Recommendations: Array.isArray(this.currentStoryboard.On_screen_Recommendations)
  //       ? this.currentStoryboard.On_screen_Recommendations.join('\n')
  //       : this.currentStoryboard.On_screen_Recommendations || '',
  //     Developer_Notes: this.currentStoryboard.Developer_Notes || ''
  //   };

  //   const payload = {
  //     client: this.client,
  //     project: this.project,
  //     module: this.currentStoryboard.Module || 'default', 
  //     storyboard: [transformedStoryboard]
  //   };
  //   console.log('Saving storyboard with payload:', payload);

  //   this.isSaving = true;
  //   this.manualInputService.saveStoryboard(payload).subscribe({
  //     next: () => {
  //       this.isEditing = false;
  //       this.originalStoryboard = null;
  //       this.onScreenTextInput = '';
  //       this.recommendationsInput = '';
  //       this.isSaving = false; 
  //       this.showSuccessToast('Storyboard saved successfully!');
  //     },
  //     error: (err) => {
  //       console.error('Error saving storyboard:', err);
  //       this.isSaving = false; 
  //       this.showErrorToast('Failed to save storyboard. Please try again.');
  //     }
  //   });
  // }

  // before json change
  // saveEditing(): void {
  //     Swal.fire({
  //     title: 'Save Changes?',
  //     text: 'This will overwrite the current storyboard data.',
  //     icon: 'warning',
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
  //       // Process on-screen text
  //       if (this.onScreenTextInput.trim()) {
  //         const lines = this.onScreenTextInput.split('\n\n');
  //         if (lines.length > 1) {
  //           this.currentStoryboard.On_screen_text = {};
  //           lines.forEach((line, index) => {
  //             const match = line.match(/^Para (\d+):\s*(.*)/);
  //             if (match) {
  //               this.currentStoryboard.On_screen_text[`para_${match[1]}`] = match[2];
  //             } else {
  //               this.currentStoryboard.On_screen_text[`para_${index + 1}`] = line;
  //             }
  //           });
  //         } else {
  //           this.currentStoryboard.On_screen_text = this.onScreenTextInput;
  //         }
  //       }

  //       // Process recommendations
  //       if (this.recommendationsInput.trim()) {
  //         this.currentStoryboard.On_screen_Recommendations = this.recommendationsInput
  //           .split('\n')
  //           .map(r => r.trim())
  //           .filter(r => r);
  //       } else {
  //         this.currentStoryboard.On_screen_Recommendations = [];
  //       }

  //       const transformedStoryboard = {
  //         Topic: this.currentStoryboard.Topic || '',
  //         Learning_Objectives: this.currentStoryboard.Learning_Objectives || '',
  //         Screen_type: this.currentStoryboard.Screen_type || '',
  //         On_screen_text: typeof this.currentStoryboard.On_screen_text === 'string'
  //           ? this.currentStoryboard.On_screen_text
  //           : Object.values(this.currentStoryboard.On_screen_text).join('\n\n'),
  //         Narration: this.currentStoryboard.Narration || '',
  //         On_screen_Recommendations: Array.isArray(this.currentStoryboard.On_screen_Recommendations)
  //           ? this.currentStoryboard.On_screen_Recommendations.join('\n')
  //           : this.currentStoryboard.On_screen_Recommendations || '',
  //         Developer_Notes: this.currentStoryboard.Developer_Notes || ''
  //       };

  //       const payload = {
  //         client: this.client,
  //         project: this.project,
  //         module: this.currentStoryboard.Module || 'default',
  //         storyboard: [transformedStoryboard]
  //       };

  //       console.log('Saving storyboard with payload:', payload);

  //       this.isSaving = true;
  //       this.manualInputService.saveStoryboard(payload).subscribe({
  //         next: () => {
  //           this.isEditing = false;
  //           this.originalStoryboard = null;
  //           this.onScreenTextInput = '';
  //           this.recommendationsInput = '';
  //           this.isSaving = false;
  //           this.showSuccessToast('Storyboard saved successfully!');
  //         },
  //         error: (err) => {
  //           console.error('Error saving storyboard:', err);
  //           this.isSaving = false;
  //           this.showErrorToast('Failed to save storyboard. Please try again.');
  //         }
  //       });
  //     }
  //   });
  // }


  // downloadStoryboard() {
  //   if (!this.storyboards || this.storyboards.length === 0) return;

  //   this.isDownloading = true; // Set downloading state

  //   const formattedStoryboards = this.storyboards.map(sb => ({
  //     Topic: sb.Topic,
  //     Learning_Objectives: sb.Learning_Objectives,
  //     Screen_type: sb.Screen_type,
  //     On_screen_text: typeof sb.On_screen_text === 'string'
  //       ? sb.On_screen_text
  //       : Object.values(sb.On_screen_text).join('\n\n'),
  //     Narration: sb.Narration,
  //     On_screen_Recommendations: Array.isArray(sb.On_screen_Recommendations)
  //       ? sb.On_screen_Recommendations.join('\n')
  //       : sb.On_screen_Recommendations,
  //     Developer_Notes: sb.Developer_Notes
  //   }));

  //   const payload = { storyboards: formattedStoryboards };
  //   console.log('📦 Sending storyboards for download:', payload);

  //   this.manualInputService.downloadStoryboard(payload).subscribe({
  //     next: (response) => {
  //       this.isDownloading = false; // Clear downloading state

  //       const blob = new Blob([response], {
  //         type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  //       });

  //       const url = window.URL.createObjectURL(blob);
  //       const a = document.createElement('a');
  //       a.href = url;
  //       a.download = `${this.client}_${this.project}_storyboards.docx`;
  //       a.click();
  //       window.URL.revokeObjectURL(url);
  //     },
  //     error: (err) => {
  //       console.error('❌ Error downloading storyboard:', err);
  //       this.isDownloading = false; // Clear downloading state
  //       this.showErrorToast('Failed to download the storyboard. Please try again.');
  //     }
  //   });
  // }






  // before json change
  // downloadStoryboard() {
  //   Swal.fire({
  //     title: 'Download Storyboard?',
  //     text: 'This will download the storyboard as a Word document.',
  //     icon: 'info',
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
  //       if (!this.storyboards || this.storyboards.length === 0) return;

  //       this.isDownloading = true;

  //       const formattedStoryboards = this.storyboards.map(sb => ({
  //         Topic: sb.Topic,
  //         Learning_Objectives: sb.Learning_Objectives,
  //         Screen_type: sb.Screen_type,
  //         On_screen_text: typeof sb.On_screen_text === 'string'
  //           ? sb.On_screen_text
  //           : Object.values(sb.On_screen_text).join('\n\n'),
  //         Narration: sb.Narration,
  //         On_screen_Recommendations: Array.isArray(sb.On_screen_Recommendations)
  //           ? sb.On_screen_Recommendations.join('\n')
  //           : sb.On_screen_Recommendations,
  //         Developer_Notes: sb.Developer_Notes
  //       }));

  //       const payload = { storyboards: formattedStoryboards };
  //       console.log('Sending storyboards for download:', payload);

  //       this.manualInputService.downloadStoryboard(payload).subscribe({
  //         next: (response) => {
  //           this.isDownloading = false;
  //           const blob = new Blob([response], {
  //             type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  //           });
  //           const url = window.URL.createObjectURL(blob);
  //           const a = document.createElement('a');
  //           a.href = url;
  //           a.download = `${this.client}_${this.project}_storyboards.docx`;
  //           a.click();
  //           window.URL.revokeObjectURL(url);
  //         },
  //         error: (err) => {
  //           console.error('Error downloading storyboard:', err);
  //           this.isDownloading = false;
  //           this.showErrorToast('Failed to download the storyboard. Please try again.');
  //         }
  //       });
  //     }
  //   });
  // }

  // applyChanges(): void {
  //   if (!this.modificationPrompt) {
  //     this.showErrorToast('Please enter a modification prompt');
  //     return;
  //   }

  //   this.isApplying = true;

  //   const payload = {
  //     client: this.client,
  //     project: this.project,
  //     applyToAll: this.applyOption === 'all',
  //     prompt: this.modificationPrompt,
  //     // ...(this.applyOption === 'current' && {  
  //     //   currentScreen: {
  //     //     topic: this.currentStoryboard.Topic,
  //     //     screenType: this.currentStoryboard.Screen_type
  //     //   }
  //     // })
  //       ...(this.applyOption === 'current' && {  // Only include pageNumber if applying to current
  //     pageNumber: this.currentIndex + 1  // Add 1 to make it 1-based instead of 0-based
  //   })
  //   };
  //   console.log('Applying changes with payload:', payload);
  //   this.manualInputService.applyChanges(payload).subscribe({
  //     next: (response) => {
  //       this.isApplying = false;
  //       this.modificationPrompt = '';
  //       this.showSuccessToast(response.message || 'Changes applied successfully!');

  //       if (this.applyOption === 'all') {
  //         this.getStoryboard();
  //       }
  //     },
  //     error: (err) => {
  //       this.isApplying = false;
  //       console.error('Error applying changes:', err);
  //       this.showErrorToast('Failed to apply changes. Please try again.');
  //     }
  //   });
  // }


  //hardcoded ajit
  // getOutlineList() {
  //   if (!this.client || !this.project || !this.selectedModule) {
  //     console.error('Client, project, or module not available');
  //     return;
  //   }

  //   this.isLoading = true;
  //   this.manualInputService.getOutlineList(this.client, this.project, this.selectedModule).subscribe({
  //     next: (response: string[]) => {
  //       this.availableOutlines = response;  // Use availableOutlines (not combinedOutlines)
  //       this.isLoading = false;

  //       // Reset selected outline if it's not in the new list
  //       if (this.selectedOutline && !this.availableOutlines.includes(this.selectedOutline)) {
  //         this.selectedOutline = '';
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error loading outlines:', err);
  //       this.showErrorToast('Failed to load outlines. Please try again.');
  //       this.isLoading = false;
  //     }
  //   });
  // }

  //new rajveer
  // getOutlineList() {
  //   if (!this.client || !this.project || !this.selectedModule) {
  //     console.error('Client, project, or module not available');
  //     return;
  //   }

  //   this.isLoading = true;
  //   this.manualInputService.getOutlineList(this.client, this.project, this.selectedModule).subscribe({
  //     next: (response: string[]) => {
  //       this.availableOutlines = response;  // Use availableOutlines (not combinedOutlines)
  //       this.isLoading = false;

  //       // Reset selected outline if it's not in the new list
  //       if (this.selectedOutline && !this.availableOutlines.includes(this.selectedOutline)) {
  //         this.selectedOutline = '';
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error loading outlines:', err);
  //       this.showErrorToast('Failed to load outlines. Please try again.');
  //       this.isLoading = false;
  //     }
  //   });
  // }

  // damodar
  
  
  // ngOnInit() {
  //   this.route.queryParams.subscribe(params => {
  //     this.client = params['client'] || '';
  //     this.project = params['project'] || '';
  //     // this.getOutlineList();
  //     this.getModules();
  //     // this.submitStoryboard();
  //     this.getStoryboard();
  //           this.getStyleGuide(); 


  //   });

  // }

