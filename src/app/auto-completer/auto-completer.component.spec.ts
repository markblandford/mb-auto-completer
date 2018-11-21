import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoCompleterComponent } from './auto-completer.component';

describe('AutoCompleterComponent', () => {
  let component: AutoCompleterComponent;
  let fixture: ComponentFixture<AutoCompleterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutoCompleterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoCompleterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
