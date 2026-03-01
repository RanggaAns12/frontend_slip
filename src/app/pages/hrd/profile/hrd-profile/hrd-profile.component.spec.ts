import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrdProfileComponent } from './hrd-profile.component';

describe('HrdProfileComponent', () => {
  let component: HrdProfileComponent;
  let fixture: ComponentFixture<HrdProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrdProfileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrdProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
