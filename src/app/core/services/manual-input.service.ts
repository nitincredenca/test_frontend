//------------------ New services
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackendOutlineItem {
  File: string;
  'Source Page': string;
  Chapter: string;
  Topic: string;
  Subtopic: string;
  'Full Page Content': string;
  'Durations (Mins)': string;
  // 'Original Query'?: string;
}

export interface OutlineResponse {
  metadata: any;
  results: BackendOutlineItem[];
}

// Interface and type for View functionality
interface FileViewResponse {
  status: 'complete' | 'processing';
  url?: string;
}

type FilesBySubfolder = Record<string, string[]>;


@Injectable({
  providedIn: 'root'
})
export class ManualInputService {

  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  // --------------------------------------------------- landingpage ---------------------------------------------------

  getClients(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/v1/client/getclients`);
  }

  getProjects(client: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/v1/client/getprojects?client=${client}`);
  }

  // --------------------------------------------------- Outline ---------------------------------------------------

  getModules(client: string, project: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/v1/outline/getmodules?client=${client}&project=${project}`);
  }

  getFiles(client: string, project: string, module: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/v1/outline/getfiles?client=${client}&project=${project}&module=${module}`
    );
  }

  submitOutline(data: any): Observable<BackendOutlineItem[]> {
    console.log('Generating outline with data:', data);
    return this.http.post<BackendOutlineItem[]>(`${this.apiUrl}/v1/outline/SubmitOutline`, data);
  }

  getOutline(): Observable<any> {
    return this.http.get(`${this.apiUrl}/v1/outline/getOutline`);
  }

  saveOutline(outline: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/outline/saveOutline`, outline);
  }


  downloadOutline(payload: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/v1/outline/downloadOutline`, payload, {
      responseType: 'blob'
    });
  }

  uploadSourceFiles(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/outline/uploadSourceFiles`, formData);
  }


  getOutlineList(client: string, project: string, module: string = ''): Observable<string[]> {
    const url = `${this.apiUrl}/v1/outline/getoutlinelist?client=${client}&project=${project}&module=${module}`;
    console.log('Requesting URL:', url);
    return this.http.get<string[]>(url);
  }

  submitStoryboard(data: any): Observable<any> {
    console.log('Sending storyboard generation request with data:', data);
    return this.http.post(`${this.apiUrl}/v1/storyboard/submitStoryboard`, data);
  }

  getStoryboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/v1/storyboard/getStoryboard`);
  }

  saveStoryboard(storyboard: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/storyboard/saveStoryboard`, storyboard);
  }

  downloadStoryboard(storyboard: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/v1/storyboard/downloadStoryboard`, storyboard, {
      responseType: 'blob'
    });
  }

  uploadOutlineFile(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/storyboard/uploadOutlineFile`, formData);
  }

  generateStoryboardWithFile(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/storyboard/generateStoryboardWithFile`, formData);
  }

  applyChanges(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/storyboard/applyChanges`, payload);
  }

  // Style Guide methods
  getStyleGuide(client: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/v1/storyboard/style-guide/${client}`);
  }

  uploadStyleGuide(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/storyboard/style-guide/upload`, formData);
  }


  getViewFiles(client: string, project: string, module: string): Observable<FilesBySubfolder> {
    return this.http.get<FilesBySubfolder>(
      `${this.apiUrl}/v1/client/getfiles?client=${client}&project=${project}&module=${module}`
    );
  }

  getFileViewUrl(filePath: string): Observable<FileViewResponse> {
    return this.http.get<FileViewResponse>(
      `${this.apiUrl}/v1/client/view-url?file_path=${filePath}`
    );
  }


  // damodar
  getOutlineMetadata(client: string, project: string, module: string, outlineFilename: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/v1/outline/getOutlineMetadata?client=${client}&project=${project}&module=${module}&outline_filename=${outlineFilename}`
    );
  }




}