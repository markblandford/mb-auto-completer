import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItemComponent } from './list-item.component';
import { AutoCompleterItem } from '..';

describe('ListItemComponent', () => {
  let component: ListItemComponent;
  let fixture: ComponentFixture<ListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit an event when the item is selected', () => {
    let itemSelected: AutoCompleterItem;

    const fakeItem = <AutoCompleterItem>{ id: 'i', displayText: 'Minion', searchableText: 'Minion' };

    component.item = fakeItem;

    component.itemSelected.subscribe(i => itemSelected = i);

    component.selectItem();

    expect(itemSelected).toBe(fakeItem);
  });

  it('should set isActive to true', () => {
    expect(component.isActive).toEqual(false);
    component.setActiveStyles();

    expect(component.isActive).toEqual(true);
  });

  it('should set isActive to false', () => {

    component.setActiveStyles();
    expect(component.isActive).toEqual(true);

    component.setInactiveStyles();
    expect(component.isActive).toEqual(false);
  });
});
