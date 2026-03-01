import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrdEmployeeFormComponent } from './hrd-employee-form.component';

describe('HrdEmployeeFormComponent', () => {
  let component: HrdEmployeeFormComponent;
  let fixture: ComponentFixture<HrdEmployeeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrdEmployeeFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrdEmployeeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
