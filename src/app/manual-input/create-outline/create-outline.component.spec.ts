import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOutlineComponent } from './create-outline.component';

describe('CreateOutlineComponent', () => {
  let component: CreateOutlineComponent;
  let fixture: ComponentFixture<CreateOutlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOutlineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateOutlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
