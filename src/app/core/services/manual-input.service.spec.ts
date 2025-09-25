import { TestBed } from '@angular/core/testing';

import { ManualInputService } from './manual-input.service';

describe('ManualInputService', () => {
  let service: ManualInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManualInputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
