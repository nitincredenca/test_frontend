import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStoryboardComponent } from './create-storyboard.component';

describe('CreateStoryboardComponent', () => {
  let component: CreateStoryboardComponent;
  let fixture: ComponentFixture<CreateStoryboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStoryboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateStoryboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
