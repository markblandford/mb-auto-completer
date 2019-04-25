import {
  QueryList,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PortalModule } from '@angular/cdk/portal';
import {
  Overlay,
  CdkOverlayOrigin
} from '@angular/cdk/overlay';
import { AutoCompleterComponent } from './auto-completer.component';
import { AutoCompleterItem } from '.';
import { ListItemComponent } from './list-overlay-handler/list-item/list-item.component';
import { ListOverlayItem } from './list-overlay-handler/list-item';
import { keys } from './list-overlay-handler/list-overlay-handler.spec';

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

class FakeListItem extends ListItemComponent<ListOverlayItem> {
  constructor(acItem: AutoCompleterItem) {
    super();
    this.item = acItem;
  }
}

describe('LgAutoCompleteComponent', () => {
  let component: AutoCompleterComponent;
  let fixture: ComponentFixture<AutoCompleterComponent>;
  const fakeListItemComponents = new FakeQueryList<ListItemComponent<ListOverlayItem>>();

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

    component.items$ = new Subject<ListOverlayItem[]>();

    fakeListItemComponents.items = [
      new FakeListItem(fakeItems[0]),
      new FakeListItem(fakeItems[1]),
      new FakeListItem(fakeItems[2])
    ];

    fixture.detectChanges();

    component.items$.next(fakeItems);
  });

  it('should create', () => {
    expect(component).toBeTruthy();

    component.items$.next(fakeItems);

    // ngOnInit
    expect(component['allItems']).toBe(fakeItems);

    // ngAfterViewInit
    expect(component['listKeyManager']).toBeDefined();
  });

  it('should show the overlay with the filtered items and update the status upon keyup of the "p" key', fakeAsync(() => {
    const keyK = <KeyboardEvent>{ code: keys['p'][1], keyCode: keys['p'][0] };

    let filteredItemsEmitted = [];
    component.filteredItems.subscribe(items => filteredItemsEmitted = items);

    const expectedFilteredList = [
      <AutoCompleterItem>{ id: '1', displayText: 'Death Grips', searchableText: 'death grips rap' }
    ];

    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.filteredList.subscribe(fl => expect(fl).toEqual(expectedFilteredList));

    component.searchInput = 'p';
    component.inputKeyup(keyK);
    tick(10);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filterStatus).toEqual('1 result found');
    expect(filteredItemsEmitted).toEqual(expectedFilteredList);
  }));

  it('should set the status to the number of results found when there are more than one result in the filter', fakeAsync(() => {
    const keyH = <KeyboardEvent>{ code: keys['h'][1], keyCode: keys['h'][0] };

    const expectedFilteredList = [
      <AutoCompleterItem>{ id: '1', displayText: 'Death Grips', searchableText: 'death grips rap'},
      <AutoCompleterItem>{ id: '2', displayText: 'HTRK', searchableText: 'htrk hate rock'},
      <AutoCompleterItem>{ id: '3', displayText: 'Death From Above', searchableText: 'Death From Above 1979'}
    ];

    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.filteredList.subscribe(fl => expect(fl).toEqual(expectedFilteredList));

    component.searchInput = 'h';
    component.inputKeyup(keyH);
    tick(10);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filterStatus).toEqual('3 results found');
  }));

  it('should set the status to no results found when there are no results in the filter', fakeAsync(() => {
    const keyZ = <KeyboardEvent>{ code: keys['z'][1], keyCode: keys['z'][0] };

    const expectedFilteredList = [];
    component.showOverlay();
    const spyDispose = spyOn(component['listItemsOverlayRef'], 'dispose').and.callFake(() => {});
    const spyShowOverlay = spyOn(component, 'showOverlay');

    component.filteredList.subscribe(fl => expect(fl).toEqual(expectedFilteredList));

    component.searchInput = 'z';
    component.inputKeyup(keyZ);
    tick(10);

    expect(spyShowOverlay).toHaveBeenCalledTimes(1);
    expect(component.filterStatus).toEqual('no results found');
    expect(spyDispose).toHaveBeenCalledTimes(1);
  }));

  it('should navigate through the list upon keyup of the down and up arrow keys and not emit a filteredItems event', fakeAsync(() => {
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ code: keys['UP_ARROW'][1], keyCode: keys['UP_ARROW'][0], preventDefault: () => {} };

    const spyFilteredItems = spyOn(component.filteredItems, 'emit');

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    expect(component.activeItemIndex).toEqual(-1);

    component.inputKeyup(keyDown);
    tick(10);
    expect(component.activeItemIndex).toEqual(0);

    component.inputKeyup(keyDown);
    tick(10);
    expect(component.activeItemIndex).toEqual(1);

    component.inputKeyup(keyUp);
    tick(10);
    expect(component.activeItemIndex).toEqual(0);

    // wraparound to the bottom of the list
    component.inputKeyup(keyUp);
    component.inputKeyup(keyUp);
    tick(20);
    expect(component.activeItemIndex).toEqual(1);
    expect(spyFilteredItems).toHaveBeenCalledTimes(0);
  }));

  it('should only emit a filteredItems event when the filtered list has changed', () => {
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyH = <KeyboardEvent>{ code: keys['h'][1], keyCode: keys['h'][0] };

    const spyFilteredItems = spyOn(component.filteredItems, 'emit');

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    component.inputKeyup(keyDown);
    component.searchInput = 'h';
    component.inputKeyup(keyH);
    component.searchInput = 'hh';
    component.inputKeyup(keyH);
    component.inputKeyup(keyDown);

    expect(spyFilteredItems).toHaveBeenCalledTimes(2);
  });

  it('should emit an event when the filtered list is empty', () => {
    const keyZ = <KeyboardEvent>{ code: keys['z'][1], keyCode: keys['z'][0] };

    const expectedFilteredList = [];

    const spyHasResults = spyOn(component.hasResults, 'emit');

    component.filteredList.subscribe(fl => expect(fl).toEqual(expectedFilteredList));

    component.searchInput = 'z';
    component.inputKeyup(keyZ);

    expect(component.filterStatus).toEqual('no results found');
    expect(spyHasResults).toHaveBeenCalledTimes(1);
    expect(spyHasResults).toHaveBeenCalledWith(false);
  });

  it('should emit an event when the filtered list goes from empty to not empty', () => {
    const keyZ = <KeyboardEvent>{ code: keys['z'][1], keyCode: keys['z'][0] };
    const keyDelete = <KeyboardEvent>{ code: keys['DELETE'][1], keyCode: keys['DELETE'][0] };

    const spyHasResults = spyOn(component.hasResults, 'emit');

    component.searchInput = 'z';
    component.inputKeyup(keyZ);

    component.searchInput = '';
    component.inputKeyup(keyDelete);

    expect(spyHasResults).toHaveBeenCalledTimes(2);
    expect(spyHasResults).toHaveBeenCalledWith(false);
    expect(spyHasResults).toHaveBeenCalledWith(true);
  });

  it('should show the overlay and update the filtered list when the overlay is called to be initialised', () => {
    const spy = spyOn(component, 'showOverlay').and.callFake(() => {});

    const expected = [
      <AutoCompleterItem>{ id: '1', displayText: 'Death Grips', searchableText: 'death grips rap'}
    ];

    component.filteredList.subscribe(fl => expect(fl).toEqual(expected));

    component.searchInput = 'rap';
    component.initialiseOverlay();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
