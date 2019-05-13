import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { ListItemComponent } from './list-item/list-item.component';
import {
  CdkOverlayOrigin,
  ConnectionPositionPair,
  Overlay,
  OverlayConfig,
  OverlayRef
} from '@angular/cdk/overlay';
import {
  AfterViewInit,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { TemplatePortalDirective } from '@angular/cdk/portal';

import { Subject } from 'rxjs';
import {
  ListOverlayItem,
  ListOverlayOptions,
  NoResultOptions
} from './list-item';

export enum KeyCodes {
  DOWN_ARROW = 'ArrowDown',
  UP_ARROW = 'ArrowUp',
  ESCAPE = 'Escape',
  ENTER = 'Enter'
}

export abstract class ListOverlayHandler<T extends ListOverlayItem> implements OnInit, AfterViewInit, OnChanges {

  public get overlayVisible(): boolean {
    if (this.listItemsOverlayRef) {
      return this.listItemsOverlayRef.hasAttached();
    }

    return false;
  }

  protected constructor(protected overlay: Overlay) {
    this.defaultOptions = <ListOverlayOptions>{
      id: '0',
      listMaxHeight: 'auto',
      noResultOptions: <NoResultOptions>{ display: false, message: 'No Results Found' },
      numberOfItemsToShow: 10,
      placeholder: 'search'
    };

    this.listOverlayOptions = this.defaultOptions;
  }
  protected readonly defaultOptions: ListOverlayOptions;
  protected allItems: ListOverlayItem[];
  protected listKeyManager: ActiveDescendantKeyManager<ListItemComponent<T>>;
  protected listItemsOverlayRef: OverlayRef;
  protected resultsMonitor: boolean;
  protected filtered: ListOverlayItem[] = [];

  public readonly listItemIdPrefix = 'ac-list-item-';

  public activeItemIndex = -1;
  public filteredList = new Subject<ListOverlayItem[]>();
  public filterStatus = '';
  public searchInput = '';
  public listOverlayOptions: ListOverlayOptions;

  @Input() items$: Subject<ListOverlayItem[]>;
  @Input() options: ListOverlayOptions;

  @Output() searchQuery = new EventEmitter<string>();
  @Output() itemSelected = new EventEmitter<ListOverlayItem>();
  @Output() filteredItems = new EventEmitter<ListOverlayItem[]>();
  @Output() hasResults = new EventEmitter<boolean>();

  @ViewChild('listOverlayItemsTemplate') listOverlayItemsTemplate: TemplatePortalDirective;
  @ViewChild(CdkOverlayOrigin) overlayOrigin: CdkOverlayOrigin;
  @ViewChildren(ListItemComponent) listItemComponents: QueryList<ListItemComponent<T>>;

  ngOnInit(): void {
    this.items$.subscribe(val => {
      this.allItems = val;
      this.filteredList.next(val);
    });
  }

  ngAfterViewInit(): void {
    this.initKeyManagerHandlers();

    const el = this.overlayOrigin.elementRef.nativeElement as HTMLElement;
    /* istanbul ignore next */
    el.onblur = () => this.hideOverlay();
  }

  ngOnChanges(changes: SimpleChanges) {
    /* istanbul ignore else */
    if (changes && changes['options']) {
      const inputOptions = changes['options'].currentValue;
      /* istanbul ignore else */
      if (inputOptions) {
        // There are some input options so merge them into the default ones
        const nro = { ...this.listOverlayOptions.noResultOptions, ...inputOptions.noResultOptions };
        this.listOverlayOptions = { ...this.listOverlayOptions, ...inputOptions };

        this.listOverlayOptions.noResultOptions = nro;
      }
    }
  }

  protected initKeyManagerHandlers() {
    this.listKeyManager = new ActiveDescendantKeyManager(this.listItemComponents).withWrap();
  }

  public showItem(item: ListOverlayItem): void {
    this.itemSelected.emit(item);
    this.hideOverlay();
  }

  public inputKeydown(event: KeyboardEvent): boolean {
    const keyCode = this.getKeyCode(event);
    // stop the cursor moving in the input box
    if (keyCode === KeyCodes.DOWN_ARROW || keyCode === KeyCodes.UP_ARROW || keyCode === KeyCodes.ENTER) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  public inputKeyup(event: KeyboardEvent): boolean {
    const keyCode = this.getKeyCode(event);
    if (keyCode === KeyCodes.ESCAPE) {
      this.hideOverlay();
    } else {
      this.showOverlay();

      if (this.listKeyManager) {
        this.listKeyManager.onKeydown(event);
      }

      this.searchMade();
      this.updateFilteredList();

      /* istanbul ignore else */
      if (this.listKeyManager) {
        if (keyCode === KeyCodes.DOWN_ARROW || keyCode === KeyCodes.UP_ARROW) {
          /* istanbul ignore else */
          if (this.listKeyManager.activeItem) {
            this.scrollToListItem();
          }

        } else if (keyCode === KeyCodes.ENTER) {
          /* istanbul ignore else */
          if (this.listKeyManager.activeItem) {
            this.listKeyManager.activeItem.selectItem();
          }
        }
      }
    }

    return false;
  }

  public onInput(event: Event): boolean {
    this.showOverlay();

    this.searchMade();
    this.updateFilteredList();

    return true;
  }

  protected getKeyCode(event: KeyboardEvent): string {
    const code = event.code;

    if (code && code !== 'Unidentified') {
      return code;
    } else {
      switch (event.key) {
        case 'Up' :
          return KeyCodes.UP_ARROW;
        case 'Down' :
          return KeyCodes.DOWN_ARROW;
        case 'Enter' :
          return KeyCodes.ENTER;
        case 'Esc' :
          return KeyCodes.ESCAPE;
        default:
          return event.key;
      }

    }
  }

  private searchMade(): void {
    this.searchQuery.emit(this.searchInput);
    this.items$.subscribe(f => this.filtered = f);
  }

  protected updateFilteredList() {
    this.filteredList.next(this.filtered);
    this.updateStatus();
  }

  protected updateStatus(clear = false): void {
    const tempHasResults = this.filtered.length > 0;

    if (this.resultsMonitor !== tempHasResults) {
      this.resultsMonitor = tempHasResults;
      this.hasResults.emit(tempHasResults);
    }

    this.updateActiveItemId();

    if (clear) {
      this.filterStatus = '';
    } else if (this.filtered && this.filtered.length > 0) {
      const count = Math.min(this.filtered.length, this.listOverlayOptions.numberOfItemsToShow);
      if (count === 1) {
        this.selectFirstItem();
        this.filterStatus = '1 result found';
      } else {
        this.filterStatus = count + ' results found';
      }
    } else {
      this.listItemsOverlayRef.dispose();
      this.filterStatus = 'no results found';
    }
  }

  public setActiveItem(index: number): void {
    this.listKeyManager.setActiveItem(index);
    this.activeItemIndex = index;
  }

  protected selectFirstItem(): void {
    // this is a hack but the only way I can figure out to select the first item in the drop-down automatically.
    setTimeout(() => {
      this.listKeyManager.setFirstItemActive();
      this.updateActiveItemId();
    }, 10);
  }

  public initialiseOverlay(): void {
    this.showOverlay();
    this.updateFilteredList();
  }

  public showOverlay(): boolean {
    if (!this.overlayVisible) {
      this.displayOverlay();

      return true;
    }

    return false;
  }

  private updateActiveItemId() {
    if (this.listKeyManager.activeItem && this.activeItemIsVisible()) {
      this.activeItemIndex = this.listKeyManager.activeItemIndex;
    } else {
      this.setActiveItem(-1);
    }
  }

  private activeItemIsVisible(): boolean {
    const idx = this.filtered.findIndex(x => x.id === this.listKeyManager.activeItem.item.id);
    return idx >= 0 && idx < this.listOverlayOptions.numberOfItemsToShow;
  }

  private scrollToListItem(): void {
    const el = document.getElementById(this.getItemId(this.listKeyManager.activeItemIndex));
    /* istanbul ignore else */
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }
  }

  public getItemId(index: number): string {
    return this.listItemIdPrefix + this.listOverlayOptions.id + '-' + index;
  }

  private hideOverlay(): void {
    this.updateStatus(true);
    this.listItemsOverlayRef.dispose();
  }

  private displayOverlay(): void {
    const positions = [
      new ConnectionPositionPair(
        { originX: 'start', originY: 'bottom' },
        { overlayX: 'start', overlayY: 'top' }),
      new ConnectionPositionPair(
        { originX: 'start', originY: 'top' },
        { overlayX: 'start', overlayY: 'bottom' })
    ];

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.overlayOrigin.elementRef)
      .withGrowAfterOpen(false)
      .withFlexibleDimensions(false)
      .withPush(false)
      .withPositions(positions);

    const config = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      positionStrategy: positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.listItemsOverlayRef = this.overlay.create(config);

    this.listItemsOverlayRef.backdropClick().subscribe(() => {
      this.hideOverlay();
    });

    this.listItemsOverlayRef.attach(this.listOverlayItemsTemplate);
  }
}
