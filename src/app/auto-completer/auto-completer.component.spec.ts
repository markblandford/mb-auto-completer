import { FormsModule } from '@angular/forms';
import {
  async,
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { PortalModule } from '@angular/cdk/portal';
import { Overlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  DOWN_ARROW,
  UP_ARROW,
  LEFT_ARROW,
  ESCAPE,
  ENTER,
  H,
  P,
  Z
} from '@angular/cdk/keycodes';

import { AutoCompleterComponent } from './auto-completer.component';
import { AutoCompleterItem } from '.';
import { ListItemComponent } from './list-item/list-item.component';
import { QueryList, ElementRef } from '@angular/core';

class FakeQueryList<T> extends QueryList<T> {
  changes = new Subject<FakeQueryList<T>>();
  items: T[];
  get length() { return this.items.length; }
  set length(_) { }
  get first() { return this.items[0]; }
  toArray() { return this.items; }
  some() { return this.items.some.apply(this.items, arguments); }
  notifyOnChanges() { this.changes.next(this); }
}

class FakeListItem extends ListItemComponent {
  constructor(acItem: AutoCompleterItem) {
    super();
    this.item = acItem;
  }
}

describe('AutoCompleterComponent', () => {
  let component: AutoCompleterComponent;
  let fixture: ComponentFixture<AutoCompleterComponent>;
  const fakeListItemComponents = new FakeQueryList<ListItemComponent>();

  const fakeItems = [
    <AutoCompleterItem>{ id: '1', displayText: 'Death Grips', searchableText: 'death grips rap'},
    <AutoCompleterItem>{ id: '2', displayText: 'HTRK', searchableText: 'htrk hate rock'},
    <AutoCompleterItem>{ id: '3', displayText: 'Death From Above', searchableText: 'Death From Above 1979'}
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AutoCompleterComponent,
        ListItemComponent
      ],
      imports: [
        FormsModule,
        PortalModule
      ],
      providers: [
        Overlay
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoCompleterComponent);
    component = fixture.componentInstance;

    component.overlayOrigin = new CdkOverlayOrigin(new ElementRef(document.createElement('div')));

    const fakeItems$ = of(fakeItems);

    component.items$ = fakeItems$;

    fakeListItemComponents.items = [
      new FakeListItem(fakeItems[0]),
      new FakeListItem(fakeItems[1]),
      new FakeListItem(fakeItems[2])
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();

    // ngOnInit
    expect(component['allItems']).toBe(fakeItems);

    // ngAfterViewInit
    expect(component['listKeyManager']).toBeDefined();
  });

  it('should emit an event when an item is selected and hide the overlay', () => {
    const selectedItem = fakeItems[1];

    let itemEmitted: AutoCompleterItem;
    component.itemSelected.subscribe((eventItem) => itemEmitted = eventItem);

    component.showOverlay();
    expect(component['listItemsOverlayRef']).toBeDefined();

    component.showItem(selectedItem);

    expect(itemEmitted).toBe(selectedItem);
    expect(component.overlayVisible).toEqual(false);
  });

  it('should prevent the default KeyboardEvent behavior only on keydown of the up and down arrow keys', () => {
    const keyDown = <KeyboardEvent>{ keyCode: DOWN_ARROW, preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ keyCode: UP_ARROW, preventDefault: () => {} };
    const keyLeft = <KeyboardEvent>{ keyCode: LEFT_ARROW, preventDefault: () => {} };

    const spyKeyDown = spyOn(keyDown, 'preventDefault');
    const spyKeyUp = spyOn(keyUp, 'preventDefault');
    const spyKeyLeft = spyOn(keyLeft, 'preventDefault');

    let result = component.inputKeydown(keyDown);
    result = component.inputKeydown(keyUp);

    expect(spyKeyDown).toHaveBeenCalledTimes(1);
    expect(spyKeyUp).toHaveBeenCalledTimes(1);
    expect(result).toEqual(false);

    result = component.inputKeydown(keyLeft);

    expect(spyKeyLeft).not.toHaveBeenCalled();
    expect(result).toEqual(true);
  });

  it('should hide the overlay on keyup of the escape key and clear the status', () => {
    const keyEsc = <KeyboardEvent>{ keyCode: ESCAPE };

    const spyHideOverlay = spyOn<any>(component, 'hideOverlay').and.callThrough();

    component.showOverlay();
    component['updateStatus']();
    expect(component.filterStatus).toEqual('no results found');

    component.inputKeyup(keyEsc);

    expect(spyHideOverlay).toHaveBeenCalledTimes(1);
    expect(component.filterStatus).toBeNull();
  });

  it('should show the overlay with the filtered items and update the status upon keyup of the "p" key', () => {
    const keyK = <KeyboardEvent>{ keyCode: P };

    const expectedFilteredItems = [
      <AutoCompleterItem>{ id: '1', displayText: 'Death Grips', searchableText: 'death grips rap'}
    ];

    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.searchQuery = 'p';
    component.inputKeyup(keyK);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filteredItems).toEqual(expectedFilteredItems);
    expect(component.filterStatus).toEqual('1 result found');
  });

  it('should set the status to no results found when there are no results in the filter', () => {
    const keyZ = <KeyboardEvent>{ keyCode: Z };

    const expectedFilteredItems = [];

    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.searchQuery = 'z';
    component.inputKeyup(keyZ);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filteredItems).toEqual(expectedFilteredItems);
    expect(component.filterStatus).toEqual('no results found');
  });

  it('should set the status to the number of results found when there are more than one result in the filter', () => {
    const keyH = <KeyboardEvent>{ keyCode: H };

    const expectedFilteredItems = [
      <AutoCompleterItem>{ id: '1', displayText: 'Death Grips', searchableText: 'death grips rap'},
      <AutoCompleterItem>{ id: '2', displayText: 'HTRK', searchableText: 'htrk hate rock'},
      <AutoCompleterItem>{ id: '3', displayText: 'Death From Above', searchableText: 'Death From Above 1979'}
    ];

    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.searchQuery = 'h';
    component.inputKeyup(keyH);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filteredItems).toEqual(expectedFilteredItems);
    expect(component.filterStatus).toEqual('3 results found');
  });

  it('should navigate through the list upon keyup of the down and up arrow keys', () => {
    const keyDown = <KeyboardEvent>{ keyCode: DOWN_ARROW, preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ keyCode: UP_ARROW, preventDefault: () => {} };

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    expect(component.activeItemIndex).toEqual(-1);

    component.inputKeyup(keyDown);
    expect(component.activeItemIndex).toEqual(0);

    component.inputKeyup(keyDown);
    expect(component.activeItemIndex).toEqual(1);

    component.inputKeyup(keyUp);
    expect(component.activeItemIndex).toEqual(0);

    // wraparound to the bottom of the list
    component.inputKeyup(keyUp);
    component.inputKeyup(keyUp);
    expect(component.activeItemIndex).toEqual(1);
  });

  it('should select the active item upon keyup of the enter key', () => {
    const keyDown = <KeyboardEvent>{ keyCode: DOWN_ARROW, preventDefault: () => {} };
    const keyEnter = <KeyboardEvent>{ keyCode: ENTER, preventDefault: () => {} };

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    const spyItemSelected = spyOn(fakeListItemComponents.items[0], 'selectItem');

    component.inputKeyup(keyDown);
    component.inputKeyup(keyEnter);

    expect(spyItemSelected).toHaveBeenCalledTimes(1);
  });


  it('should set the active item in the key manager', () => {
    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    expect(component.activeItemIndex).toEqual(-1);

    component.setActiveItem(1);

    expect(component.activeItemIndex).toEqual(1);
  });

  it('should show the overlay if it is not already visible and update the active item after 10 milliseconds', fakeAsync(() => {
    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    expect(component.overlayVisible).toEqual(false);

    const result = component.showOverlay();
    tick(10);

    expect(component.overlayVisible).toEqual(true);
    expect(result).toEqual(true);

    expect(fakeListItemComponents.items[0].isActive).toEqual(true);
    expect(component.activeItemIndex).toEqual(0);
  }));

  it('should set the active item after 10 milliseconds to -1 when the overlay is shown if there is no active item', fakeAsync(() => {
    const noItemComponents = new FakeQueryList<ListItemComponent>();
    noItemComponents.items = [];

    component.listItemComponents = noItemComponents;
    component.ngAfterViewInit();

    expect(component.overlayVisible).toEqual(false);

    const result = component.showOverlay();
    tick(10);

    expect(component.overlayVisible).toEqual(true);
    expect(result).toEqual(true);

    expect(component.activeItemIndex).toEqual(-1);
  }));

  it('should not show the overlay if it is already visible', () => {
    expect(component.overlayVisible).toEqual(false);

    component.showOverlay();

    expect(component.overlayVisible).toEqual(true);

    const result = component.showOverlay();
    expect(component.overlayVisible).toEqual(true);
    expect(result).toEqual(false);
  });

  it('should hide the overlay when the backdrop is clicked', fakeAsync(() => {
    component.showOverlay();
    tick(10);
    expect(component.overlayVisible).toEqual(true);

    component['listItemsOverlayRef'].backdropElement.click();

    // not sure why but I can't set this to anything lower than 500ms
    tick(500);

    expect(component.overlayVisible).toEqual(false);
  }));

  it('should scroll to the list item upon keyup of the down and up arrow keys', () => {
    const keyDown = <KeyboardEvent>{ keyCode: DOWN_ARROW, preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ keyCode: UP_ARROW, preventDefault: () => {} };

    const fakeElement = jasmine.createSpyObj('HTMLElement', [ 'scrollIntoView' ]);

    spyOn(document, 'getElementById').and.returnValue(fakeElement);

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    component.inputKeyup(keyDown);
    component.inputKeyup(keyUp);

    expect(fakeElement.scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
