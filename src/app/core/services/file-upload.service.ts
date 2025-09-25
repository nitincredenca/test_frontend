import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  private apiUrl = environment.apiUrl;
 constructor(private http: HttpClient) { }


  uploadFiles(files: File[], styleGuide?: File): Observable<any> {
    // Mock response
    const response = {
      success: true,
      message: 'Files uploaded successfully',
      fileNames: files.map(f => f.name),
      styleGuide: styleGuide?.name
    };
    return of(response).pipe(delay(1000));
  }

  generateOutlineFromFiles(data: any): Observable<any> {
    // Mock response
    const response = {
      success: true,
      outline: {
        title: 'Generated Outline from Files',
        sections: [
          { title: 'Introduction', content: 'Introduction content from files...' },
          { title: 'Main Content', content: 'Main content from files...' },
          { title: 'Conclusion', content: 'Conclusion content from files...' }
        ]
      }
    };
    return of(response).pipe(delay(1200));
  }

  generateStoryboardFromFiles(data: any): Observable<any> {
    // Mock response
    const response = {
      success: true,
      storyboard: {
        title: 'Generated Storyboard from Files',
        pages: [
          { title: 'Page 1', content: 'Page 1 content from files...' },
          { title: 'Page 2', content: 'Page 2 content from files...' },
          { title: 'Page 3', content: 'Page 3 content from files...' }
        ]
      }
    };
    return of(response).pipe(delay(1500));
  }
}