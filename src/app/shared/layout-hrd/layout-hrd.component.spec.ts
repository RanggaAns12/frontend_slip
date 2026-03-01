import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutHrdComponent } from './layout-hrd.component';

describe('LayoutHrdComponent', () => {
  let component: LayoutHrdComponent;
  let fixture: ComponentFixture<LayoutHrdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayoutHrdComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LayoutHrdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
