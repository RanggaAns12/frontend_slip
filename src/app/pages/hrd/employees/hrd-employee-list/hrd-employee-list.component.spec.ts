import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrdEmployeeListComponent } from './hrd-employee-list.component';

describe('HrdEmployeeListComponent', () => {
  let component: HrdEmployeeListComponent;
  let fixture: ComponentFixture<HrdEmployeeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrdEmployeeListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrdEmployeeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
