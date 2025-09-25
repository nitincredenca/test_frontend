import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'safeText',
  standalone: true
})
export class SafeTextPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value
      .replace(/â€™/g, '’')
      .replace(/â€œ/g, '“')
      .replace(/â€�/g, '”')
      .replace(/â€“/g, '–')
      .replace(/â€”/g, '—')
      .replace(/â€/g, '€')
      .replace(/Ã©/g, 'é')
      .replace(/Ã/g, 'à')
      .replace(/Â/g, '');
  }
}