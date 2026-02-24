import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlipListComponent } from './slip-list.component';

describe('SlipListComponent', () => {
  let component: SlipListComponent;
  let fixture: ComponentFixture<SlipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SlipListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SlipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
