import {
  Component,
  EventEmitter,
  QueryList,
  ViewChildren,
  AfterViewInit,
  Input,
  ViewChild,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  Overlay,
  OverlayConfig,
  OverlayRef,
  CdkOverlayOrigin,
  ConnectionPositionPair
} from '@angular/cdk/overlay';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { TemplatePortalDirective } from '@angular/cdk/portal';
import { Observable } from 'rxjs';

import {
  AutoCompleterItem,
  AutoCompleterOptions,
  NoResultOptions
} from '.';
import { ListItemComponent } from './list-item/list-item.component';

enum KeyCodes {
  DOWN_ARROW = 'ArrowDown',
  UP_ARROW = 'ArrowUp',
  ESCAPE = 'Escape',
  ENTER = 'Enter'
}

@Component({
  selector: 'app-auto-completer',
  templateUrl: './auto-completer.component.html',
  styleUrls: ['./auto-completer.component.scss']
})
export class AutoCompleterComponent implements OnInit, AfterViewInit, OnChanges {
  private allItems: AutoCompleterItem[];
  private listKeyManager: ActiveDescendantKeyManager<ListItemComponent>;
  private listItemsOverlayRef: OverlayRef;
  private defaultOptions: AutoCompleterOptions;

  public readonly listItemIdPrefix = 'ac-list-item-';

  public activeItemIndex = -1;
  public filteredList: AutoCompleterItem[] = [];
  public filterStatus = '';
  public overlayVisible = false;
  public searchQuery = '';
  public autoCompleterOptions: AutoCompleterOptions;

  @Input() items$: Observable<AutoCompleterItem[]>;
  @Input() options: AutoCompleterOptions;

  @Output() itemSelected = new EventEmitter<AutoCompleterItem>();
  @Output() filteredItems = new EventEmitter<AutoCompleterItem[]>();

  @ViewChild('listItemsTemplate') listItemsTemplate: TemplatePortalDirective;
  @ViewChild(CdkOverlayOrigin) overlayOrigin: CdkOverlayOrigin;
  @ViewChildren(ListItemComponent) listItemComponents: QueryList<ListItemComponent>;

  constructor(private overlay: Overlay) {
    this.defaultOptions = <AutoCompleterOptions>{
      id: '0',
      listMaxHeight: 'auto',
      noResultOptions: <NoResultOptions>{ display: true, message: 'No Results Found' },
      numberOfItemsToShow: 10,
      placeholder: 'search'
    };

    this.autoCompleterOptions = this.defaultOptions;
  }

  ngOnInit(): void {
    this.items$.subscribe(val => {
      this.allItems = val;
    });
  }

  ngAfterViewInit(): void {
    this.initKeyManagerHandlers();
  }

  ngOnChanges(changes: SimpleChanges) {
    /* istanbul ignore else */
    if (changes && changes['options']) {
      const inputOptions = changes['options'].currentValue;
      /* istanbul ignore else */
      if (inputOptions) {
        // There are some input options so merge them into the default ones
        const nro = { ...this.autoCompleterOptions.noResultOptions, ...inputOptions.noResultOptions };
        this.autoCompleterOptions = { ...this.autoCompleterOptions, ...inputOptions };

        this.autoCompleterOptions.noResultOptions = nro;
      }
    }
  }

  private initKeyManagerHandlers() {
    this.listKeyManager = new ActiveDescendantKeyManager(this.listItemComponents).withWrap();
  }

  public showItem(item: AutoCompleterItem): void {
    this.itemSelected.emit(item);
    this.hideOverlay();
  }

  public inputKeydown(event: KeyboardEvent): boolean {
    // stop the cursor moving in the input box
    if (event.code === KeyCodes.DOWN_ARROW || event.code === KeyCodes.UP_ARROW) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  public inputKeyup(event: KeyboardEvent): boolean {
    if (event.code === KeyCodes.ESCAPE) {
      this.hideOverlay();
    } else {
      this.showOverlay();

      this.filteredList = this.allItems.filter(p => p.searchableText.toLowerCase().includes(this.searchQuery.toLowerCase()));
      this.filteredItems.emit(this.filteredList);
      this.updateStatus();

      /* istanbul ignore else */
      if (this.listKeyManager) {
        if (event.code === KeyCodes.DOWN_ARROW || event.code === KeyCodes.UP_ARROW) {

          this.listKeyManager.onKeydown(event);

          /* istanbul ignore else */
          if (this.listKeyManager.activeItem) {
            this.scrollToListItem();
          }

          this.updateActiveItemId();

        } else if (event.code === KeyCodes.ENTER) {
          /* istanbul ignore else */
          if (this.listKeyManager.activeItem) {
            this.listKeyManager.activeItem.selectItem();
          }
        }
      }
    }

    return false;
  }

  private updateStatus(clear = false): void {
    if (clear) {
      this.filterStatus = null;
    } else if (this.filteredList && this.filteredList.length > 0) {
      const count = Math.min(this.filteredList.length, this.autoCompleterOptions.numberOfItemsToShow);
      if (count === 1) {
        this.filterStatus = '1 result found';
      } else {
        this.filterStatus = count + ' results found';
      }
    } else {
      this.filterStatus = 'no results found';
    }
  }

  public setActiveItem(index: number): void {
    this.listKeyManager.setActiveItem(index);
    this.activeItemIndex = index;
  }

  public showOverlay(): boolean {
    if (!this.overlayVisible) {
      this.displayOverlay();

      // this is a hack but the only way I can figure out to select the first item in the drop-down automatically.
      setTimeout(() => {
        this.listKeyManager.setFirstItemActive();
        this.updateActiveItemId();
      }, 10);

      return true;
    }

    return false;
  }

  private updateActiveItemId() {
    if (this.listKeyManager.activeItem) {
      this.activeItemIndex = this.listKeyManager.activeItemIndex;
    } else {
      this.activeItemIndex = -1;
    }
  }

  private scrollToListItem(): void {
    const el = document.getElementById(this.getItemId(this.listKeyManager.activeItemIndex));
    /* istanbul ignore else */
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }
  }

  public getItemId(index: number): string {
    return this.listItemIdPrefix + this.autoCompleterOptions.id + '-' + index;
  }

  private hideOverlay(): void {
    this.updateStatus(true);
    this.overlayVisible = false;
    this.listItemsOverlayRef.dispose();
  }

  private displayOverlay(): void {
    this.overlayVisible = true;

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

    this.listItemsOverlayRef.attach(this.listItemsTemplate);
  }
}
