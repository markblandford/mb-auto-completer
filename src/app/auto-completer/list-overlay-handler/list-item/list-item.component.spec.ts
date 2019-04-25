import { async, TestBed } from '@angular/core/testing';

import { ListItemComponent } from './list-item.component';
import { ListOverlayItem } from '.';

describe('ListItemComponent', () => {
  let component: ListItemComponent<ListOverlayItem>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    component = new ListItemComponent<ListOverlayItem>();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit an event when the item is selected', () => {
    let itemSelected: ListOverlayItem;

    const fakeItem = <ListOverlayItem>{ id: 'i', displayText: 'Minion' };

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
