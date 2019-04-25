import {
  QueryList,
  ElementRef,
  SimpleChange,
  Component,
  TemplateRef
} from '@angular/core';
import {
  async,
  TestBed
} from '@angular/core/testing';
import { Subject } from 'rxjs';
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
import { ListItemComponent } from './list-item/list-item.component';
import { FormsModule } from '@angular/forms';
import { PortalModule } from '@angular/cdk/portal';
import { ListOverlayHandler } from './list-overlay-handler';
import {
  ListOverlayItem,
  ListOverlayOptions,
  NoResultOptions
} from './list-item';

// seems the ActiveDescendantKeyManager is still using the deprecated keyCode property, hence this mapping
export const keys = {
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

class FakeListItem extends ListItemComponent<ListOverlayItem> {
  constructor(item: ListOverlayItem) {
    super();
    this.item = item;
  }
}

@Component({
  selector: 'app-test-list-overlay',
  template: `
    <input cdkOverlayOrigin>
    <ng-template cdkPortal #listOverlayItemsTemplate="cdkPortal"></ng-template>
  `
})
class TestListOverlayHandlerComponent extends ListOverlayHandler<ListOverlayItem> {
  constructor(overlay: Overlay) {
    super(overlay);
  }
}

describe('ListOverlayHandler', () => {
  let component: TestListOverlayHandlerComponent;
  const fakeListItemComponents = new FakeQueryList<ListItemComponent<ListOverlayItem>>();

  const fakeItems = [
    <ListOverlayItem>{ id: '1', displayText: 'Death Grips' },
    <ListOverlayItem>{ id: '2', displayText: 'HTRK' },
    <ListOverlayItem>{ id: '3', displayText: 'Death From Above' }
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestListOverlayHandlerComponent
      ],
      imports: [
        FormsModule,
        PortalModule
      ],
      providers: [
        Overlay,
        TemplateRef
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    const fixture = TestBed.createComponent(TestListOverlayHandlerComponent);

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

    // ngOnInit
    expect(component['allItems']).toBe(fakeItems);

    // ngAfterViewInit
    expect(component['listKeyManager']).toBeDefined();
  });

  it('should enable hiding the overlay when it loses focus', () => {
    component.ngAfterViewInit();

    const el = component.overlayOrigin.elementRef.nativeElement as HTMLElement;
    const funcSetAsString = el.onblur.toString();

    expect(funcSetAsString).toContain('.hideOverlay()');
  });

  it('should define the default options', () => {
    const expectedOptions = <ListOverlayOptions>{
      id: '0',
      listMaxHeight: 'auto',
      noResultOptions: <NoResultOptions>{ display: false, message: 'No Results Found' },
      numberOfItemsToShow: 10,
      placeholder: 'search'
    };

    expect(component.listOverlayOptions).toEqual(expectedOptions);
  });

  it('should merge any input options with the default options', () => {
    const expectedOptions = <ListOverlayOptions>{
      id: 'abc',
      listMaxHeight: 'auto',
      noResultOptions: <NoResultOptions>{ display: false, message: 'No Results Found' },
      numberOfItemsToShow: 100,
      placeholder: 'search'
    };

    const inputOptions = <ListOverlayOptions>{
      id: 'abc',
      noResultOptions: <NoResultOptions>{ display: false },
      numberOfItemsToShow: 100,
      placeholder: 'search'
    };

    component.ngOnChanges({
      options: new SimpleChange(null, inputOptions, true)
    });

    expect(component.listOverlayOptions).toEqual(expectedOptions);
  });

  it('should emit an event when an item is selected and hide the overlay', () => {
    const selectedItem = fakeItems[1];

    let itemEmitted: ListOverlayItem;
    component.itemSelected.subscribe((eventItem) => itemEmitted = eventItem);

    component.showOverlay();
    expect(component['listItemsOverlayRef']).toBeDefined();

    component.showItem(selectedItem);

    expect(itemEmitted).toBe(selectedItem);
    expect(component.overlayVisible).toEqual(false);
  });

  it('should prevent the default KeyboardEvent behavior only on keydown of the up and down arrow keys and the Enter key', () => {
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ code: keys['UP_ARROW'][1], keyCode: keys['UP_ARROW'][0], preventDefault: () => {} };
    const keyLeft = <KeyboardEvent>{ code: keys['LEFT_ARROW'][1], keyCode: keys['LEFT_ARROW'][0], preventDefault: () => {} };
    const keyEnter = <KeyboardEvent>{ code: keys['ENTER'][1], keyCode: keys['ENTER'][0], preventDefault: () => {} };

    const spyKeyDown = spyOn(keyDown, 'preventDefault');
    const spyKeyUp = spyOn(keyUp, 'preventDefault');
    const spyKeyLeft = spyOn(keyLeft, 'preventDefault');
    const spyKeyEnter = spyOn(keyEnter, 'preventDefault');

    let result = component.inputKeydown(keyDown);
    result = component.inputKeydown(keyUp);
    result = component.inputKeydown(keyEnter);

    expect(spyKeyDown).toHaveBeenCalledTimes(1);
    expect(spyKeyUp).toHaveBeenCalledTimes(1);
    expect(spyKeyEnter).toHaveBeenCalledTimes(1);
    expect(result).toEqual(false);

    result = component.inputKeydown(keyLeft);

    expect(spyKeyLeft).not.toHaveBeenCalled();
    expect(result).toEqual(true);
  });

  it('should hide the overlay on keyup of the escape key and clear the status', () => {
    const keyEsc = <KeyboardEvent>{ code: keys['ESCAPE'][1], keyCode: keys['ESCAPE'][0] };

    const spyHideOverlay = spyOn<any>(component, 'hideOverlay').and.callThrough();

    component.showOverlay();

    component.inputKeyup(keyEsc);

    expect(spyHideOverlay).toHaveBeenCalledTimes(1);
    expect(component.filterStatus).toEqual('');
  });

  it('should select the active item upon keyup of the enter key and not emit a filteredItems event', () => {
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyEnter = <KeyboardEvent>{ code: keys['ENTER'][1], keyCode: keys['ENTER'][0], preventDefault: () => {} };

    const spyFilteredItems = spyOn(component.filteredItems, 'emit');

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();
    component['filtered'] = fakeItems;

    const spyItemSelected = spyOn(fakeListItemComponents.items[0], 'selectItem');

    component.inputKeyup(keyDown);
    component.inputKeyup(keyEnter);

    expect(spyItemSelected).toHaveBeenCalledTimes(1);
    expect(spyFilteredItems).toHaveBeenCalledTimes(0);
  });

  it('should set the active item in the key manager', () => {
    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    expect(component.activeItemIndex).toEqual(-1);

    component.setActiveItem(1);

    expect(component.activeItemIndex).toEqual(1);
  });

  it('should show the overlay if it is not already visible and not select the first item', () => {
    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();

    expect(component.overlayVisible).toEqual(false);

    component.filteredList.next([fakeItems[0]]);

    const result = component.showOverlay();

    expect(component.overlayVisible).toEqual(true);
    expect(result).toEqual(true);

    expect(fakeListItemComponents.items[0].isActive).toEqual(false);
    expect(component.activeItemIndex).toEqual(-1);
  });

  it('should set the active item to -1 when the overlay is shown if there is no active item', () => {
    const noItemComponents = new FakeQueryList<ListItemComponent<ListOverlayItem>>();
    noItemComponents.items = [];

    component.listItemComponents = noItemComponents;
    component.ngAfterViewInit();

    expect(component.overlayVisible).toEqual(false);

    const result = component.showOverlay();

    expect(component.overlayVisible).toEqual(true);
    expect(result).toEqual(true);

    expect(component.activeItemIndex).toEqual(-1);
  });

  it('should not show the overlay if it is already visible', () => {
    expect(component.overlayVisible).toEqual(false);

    component.showOverlay();

    expect(component.overlayVisible).toEqual(true);

    const result = component.showOverlay();
    expect(component.overlayVisible).toEqual(true);
    expect(result).toEqual(false);
  });

  it('should hide the overlay when the backdrop is clicked', () => {
    component.showOverlay();

    expect(component.overlayVisible).toEqual(true);

    component['listItemsOverlayRef'].backdropElement.click();

    expect(component.overlayVisible).toEqual(false);
  });

  it('should scroll to the list item upon keyup of the down and up arrow keys', () => {
    const keyDown = <KeyboardEvent>{ code: keys['DOWN_ARROW'][1], keyCode: keys['DOWN_ARROW'][0], preventDefault: () => {} };
    const keyUp = <KeyboardEvent>{ code: keys['UP_ARROW'][1], keyCode: keys['UP_ARROW'][0], preventDefault: () => {} };

    const fakeElement = jasmine.createSpyObj('HTMLElement', [ 'scrollIntoView' ]);

    spyOn(document, 'getElementById').and.returnValue(fakeElement);

    component.listItemComponents = fakeListItemComponents;
    component.ngAfterViewInit();
    component['filtered'] = fakeItems;

    component.inputKeyup(keyDown);
    component.inputKeyup(keyUp);

    expect(fakeElement.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('should generate a good item id', () => {
    const expected = 'ac-list-item-x-99';

    component.listOverlayOptions.id = 'x';

    expect(component.getItemId(99)).toEqual(expected);
  });

  it('should understand keyboard events triggered by IE11 or IOS (safari), which do not support the `code` property', () => {
    // apologies for using the bracket notation to get to the private method, it's just easier for this specific test
    const IOSKeyUp = <KeyboardEvent>{ code: 'Unidentified', key: 'Up' };
    expect(component['getKeyCode'](IOSKeyUp)).toEqual('ArrowUp');

    const IEKeyDown = <KeyboardEvent>{ key: 'Down' };
    expect(component['getKeyCode'](IEKeyDown)).toEqual('ArrowDown');

    const IEKeyEnter = <KeyboardEvent>{ key: 'Enter' };
    expect(component['getKeyCode'](IEKeyEnter)).toEqual('Enter');

    const IEKeyEsc = <KeyboardEvent>{ key: 'Esc' };
    expect(component['getKeyCode'](IEKeyEsc)).toEqual('Escape');

    const IEKeyA = <KeyboardEvent>{ key: 'A' };
    expect(component['getKeyCode'](IEKeyA)).toEqual('A');
  });

  it('should update the filtered with the current items on keyup', () => {
    const keyA = <KeyboardEvent>{ key: 'A' };

    component.items$.subscribe(f => expect(f).toEqual(fakeItems));

    component.inputKeyup(keyA);
    component.items$.next(fakeItems);

    expect(component['filtered']).toEqual(fakeItems);
  });
});
