import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrdEmployeeDetailComponent } from './hrd-employee-detail.component';

describe('HrdEmployeeDetailComponent', () => {
  let component: HrdEmployeeDetailComponent;
  let fixture: ComponentFixture<HrdEmployeeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrdEmployeeDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrdEmployeeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
