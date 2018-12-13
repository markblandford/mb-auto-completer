import {
  QueryList,
  ElementRef,
  SimpleChange
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  async,
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import {
  of,
  Subject
} from 'rxjs';
import { PortalModule } from '@angular/cdk/portal';
import {
  Overlay,
  CdkOverlayOrigin
} from '@angular/cdk/overlay';
import {
  DOWN_ARROW,
  UP_ARROW,
  LEFT_ARROW,
  ESCAPE,
  ENTER,
  DELETE,
  H,
  P,
  Z
} from '@angular/cdk/keycodes';
import { AutoCompleterComponent } from './auto-completer.component';
import {
  AutoCompleterItem,
  AutoCompleterOptions,
  NoResultOptions
} from '.';
import { ListItemComponent } from './list-item/list-item.component';

// seems the ActiveDescendantKeyManager is still using the deprecated keyCode property, hence this mapping
const keys = {
  'DOWN_ARROW': [DOWN_ARROW, 'ArrowDown'],
  'UP_ARROW': [UP_ARROW, 'ArrowUp'],
  'LEFT_ARROW': [LEFT_ARROW, 'ArrowLeft'],
  'ESCAPE': [ESCAPE, 'Escape'],
  'ENTER': [ENTER, 'Enter'],
  'DELETE': [DELETE, 'Delete'],
  'h': [H, 'h'],
  'p': [P, 'p'],
  'z': [Z, 'z']
};

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

  it('should define the default options', () => {
    const expectedOptions = <AutoCompleterOptions>{
      id: '0',
      listMaxHeight: 'auto',
      noResultOptions: <NoResultOptions>{ display: true, message: 'No Results Found' },
      numberOfItemsToShow: 10,
      placeholder: 'search'
    };

    expect(component.autoCompleterOptions).toEqual(expectedOptions);
  });

  it('should merge any input options with the default options', () => {
    const expectedOptions = <AutoCompleterOptions>{
      id: 'abc',
      listMaxHeight: 'auto',
      noResultOptions: <NoResultOptions>{ display: false, message: 'No Results Found' },
      numberOfItemsToShow: 100,
      placeholder: 'search'
    };

    const inputOptions = <AutoCompleterOptions>{
      id: 'abc',
      noResultOptions: <NoResultOptions>{ display: false },
      numberOfItemsToShow: 100,
      placeholder: 'search'
    };

    component.ngOnChanges({
      options: new SimpleChange(null, inputOptions, true)
    });

    expect(component.autoCompleterOptions).toEqual(expectedOptions);
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
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ code: keys['UP_ARROW'][1], keyCode: keys['UP_ARROW'][0], preventDefault: () => {} };
    const keyLeft = <KeyboardEvent>{ code: keys['LEFT_ARROW'][1], keyCode: keys['LEFT_ARROW'][0], preventDefault: () => {} };

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
    const keyEsc = <KeyboardEvent>{ code: keys['ESCAPE'][1], keyCode: keys['ESCAPE'][0] };

    const spyHideOverlay = spyOn<any>(component, 'hideOverlay').and.callThrough();

    component.showOverlay();
    component['updateStatus']();
    expect(component.filterStatus).toEqual('no results found');

    component.inputKeyup(keyEsc);

    expect(spyHideOverlay).toHaveBeenCalledTimes(1);
    expect(component.filterStatus).toBeNull();
  });

  it('should show the overlay with the filtered items and update the status upon keyup of the "p" key', () => {
    const keyK = <KeyboardEvent>{ code: keys['p'][1], keyCode: keys['p'][0] };

    let filteredItemsEmitted = [];
    component.filteredItems.subscribe(items => filteredItemsEmitted = items);

    const expectedFilteredList = [
      <AutoCompleterItem>{ id: '1', displayText: 'Death Grips', searchableText: 'death grips rap' }
    ];

    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.searchQuery = 'p';
    component.inputKeyup(keyK);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filteredList).toEqual(expectedFilteredList);
    expect(component.filterStatus).toEqual('1 result found');
    expect(filteredItemsEmitted).toEqual(expectedFilteredList);
  });

  it('should set the status to no results found when there are no results in the filter', () => {
    const keyZ = <KeyboardEvent>{ code: keys['z'][1], keyCode: keys['z'][0] };

    const expectedFilteredList = [];

    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.searchQuery = 'z';
    component.inputKeyup(keyZ);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filteredList).toEqual(expectedFilteredList);
    expect(component.filterStatus).toEqual('no results found');
  });

  it('should set the status to the number of results found when there are more than one result in the filter', () => {
    const keyH = <KeyboardEvent>{ code: keys['h'][1], keyCode: keys['h'][0] };

    const expectedFilteredList = [
      <AutoCompleterItem>{ id: '1', displayText: 'Death Grips', searchableText: 'death grips rap'},
      <AutoCompleterItem>{ id: '2', displayText: 'HTRK', searchableText: 'htrk hate rock'},
      <AutoCompleterItem>{ id: '3', displayText: 'Death From Above', searchableText: 'Death From Above 1979'}
    ];

    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.searchQuery = 'h';
    component.inputKeyup(keyH);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filteredList).toEqual(expectedFilteredList);
    expect(component.filterStatus).toEqual('3 results found');
  });

  it('should navigate through the list upon keyup of the down and up arrow keys and not emit a filteredItems event', () => {
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ code: keys['UP_ARROW'][1], keyCode: keys['UP_ARROW'][0], preventDefault: () => {} };

    const spyFilteredItems = spyOn(component.filteredItems, 'emit');

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
    expect(spyFilteredItems).toHaveBeenCalledTimes(0);
  });

  it('should select the active item upon keyup of the enter key and not emit a filteredItems event', () => {
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyEnter = <KeyboardEvent>{ code: keys['ENTER'][1], keyCode: keys['ENTER'][0], preventDefault: () => {} };

    const spyFilteredItems = spyOn(component.filteredItems, 'emit');

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    const spyItemSelected = spyOn(fakeListItemComponents.items[0], 'selectItem');

    component.inputKeyup(keyDown);
    component.inputKeyup(keyEnter);

    expect(spyItemSelected).toHaveBeenCalledTimes(1);
    expect(spyFilteredItems).toHaveBeenCalledTimes(0);
  });

  it('should only emit a filteredItems event when the filtered list has changed', () => {
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyH = <KeyboardEvent>{ code: keys['h'][1], keyCode: keys['h'][0] };

    const spyFilteredItems = spyOn(component.filteredItems, 'emit');

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    component.inputKeyup(keyDown);
    component.searchQuery = 'h';
    component.inputKeyup(keyH);
    component.searchQuery = 'hh';
    component.inputKeyup(keyH);
    component.inputKeyup(keyDown);

    expect(spyFilteredItems).toHaveBeenCalledTimes(2);
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
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ code: keys['UP_ARROW'][1], keyCode: keys['UP_ARROW'][0], preventDefault: () => {} };

    const fakeElement = jasmine.createSpyObj('HTMLElement', [ 'scrollIntoView' ]);

    spyOn(document, 'getElementById').and.returnValue(fakeElement);

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    component.inputKeyup(keyDown);
    component.inputKeyup(keyUp);

    expect(fakeElement.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('should generate a good item id', () => {
    const expected = 'ac-list-item-x-99';

    component.autoCompleterOptions.id = 'x';

    expect(component.getItemId(99)).toEqual(expected);
  });

  it('should emit an event when the filtered list is empty', () => {
    const keyZ = <KeyboardEvent>{ code: keys['z'][1], keyCode: keys['z'][0] };

    const expectedFilteredList = [];

    const spyHasResults = spyOn(component.hasResults, 'emit');

    component.searchQuery = 'z';
    component.inputKeyup(keyZ);

    expect(component.filteredList).toEqual(expectedFilteredList);
    expect(component.filterStatus).toEqual('no results found');
    expect(spyHasResults).toHaveBeenCalledTimes(1);
    expect(spyHasResults).toHaveBeenCalledWith(false);
  });

  it('should emit an event when the filtered list goes from empty to not empty', () => {
    const keyZ = <KeyboardEvent>{ code: keys['z'][1], keyCode: keys['z'][0] };
    const keyDelete = <KeyboardEvent>{ code: keys['DELETE'][1], keyCode: keys['DELETE'][0] };

    const spyHasResults = spyOn(component.hasResults, 'emit');

    component.searchQuery = 'z';
    component.inputKeyup(keyZ);

    component.searchQuery = '';
    component.inputKeyup(keyDelete);

    expect(spyHasResults).toHaveBeenCalledTimes(2);
    expect(spyHasResults).toHaveBeenCalledWith(false);
    expect(spyHasResults).toHaveBeenCalledWith(true);
  });
});
