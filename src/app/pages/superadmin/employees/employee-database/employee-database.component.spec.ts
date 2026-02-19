import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDatabaseComponent } from './employee-database.component';

describe('EmployeeDatabaseComponent', () => {
  let component: EmployeeDatabaseComponent;
  let fixture: ComponentFixture<EmployeeDatabaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeDatabaseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeDatabaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
