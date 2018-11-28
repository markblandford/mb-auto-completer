import {
  Component,
  EventEmitter,
  QueryList,
  ViewChildren,
  AfterViewInit,
  Input,
  ViewChild,
  Output,
  OnInit
} from '@angular/core';
import {
  Overlay,
  OverlayConfig,
  OverlayRef,
  CdkOverlayOrigin
} from '@angular/cdk/overlay';
import {
  UP_ARROW,
  DOWN_ARROW,
  ENTER,
  ESCAPE
} from '@angular/cdk/keycodes';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { TemplatePortalDirective } from '@angular/cdk/portal';
import { Observable } from 'rxjs';

import { AutoCompleterItem } from '.';
import { ListItemComponent } from './list-item/list-item.component';

@Component({
  selector: 'app-auto-completer',
  templateUrl: './auto-completer.component.html',
  styleUrls: ['./auto-completer.component.scss']
})
export class AutoCompleterComponent implements OnInit, AfterViewInit {
  private allItems: AutoCompleterItem[];
  private listKeyManager: ActiveDescendantKeyManager<ListItemComponent>;
  private listItemsOverlayRef: OverlayRef;

  public readonly listItemIdPrefix = 'ac-list-item-';

  public activeItemIndex = -1;
  public filteredItems: AutoCompleterItem[] = [];
  public filterStatus = '';
  public overlayVisible = false;
  public searchQuery = '';

  @Input() id = '0';
  @Input() items$: Observable<AutoCompleterItem[]>;
  @Input() listMaxHeight = 'auto';
  @Input() numberOfItemsToShow = 10;
  @Input() placeHolder = 'search';

  @Output() itemSelected = new EventEmitter<AutoCompleterItem>();

  @ViewChild('listItemsTemplate') listItemsTemplate: TemplatePortalDirective;
  @ViewChild(CdkOverlayOrigin) overlayOrigin: CdkOverlayOrigin;
  @ViewChildren(ListItemComponent) listItemComponents: QueryList<ListItemComponent>;

  constructor(private overlay: Overlay) { }

  ngOnInit(): void {
    this.items$.subscribe(val => {
      this.allItems = val;
    });
  }

  ngAfterViewInit(): void {
    this.initKeyManagerHandlers();
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
    if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  public inputKeyup(event: KeyboardEvent): boolean {
    if (event.keyCode === ESCAPE) {
      this.hideOverlay();
    } else {
      this.showOverlay();

      this.filteredItems = this.allItems.filter(p => p.searchableText.toLowerCase().includes(this.searchQuery.toLowerCase()));

      this.updateStatus();

      /* istanbul ignore else */
      if (this.listKeyManager) {
        if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {

          this.listKeyManager.onKeydown(event);

          /* istanbul ignore else */
          if (this.listKeyManager.activeItem) {
            this.scrollToListItem();
          }

          this.updateActiveItemId();

        } else if (event.keyCode === ENTER) {
          /* istanbul ignore else */
          if (this.listKeyManager.activeItem) {
            this.listKeyManager.activeItem.selectItem();
          }
        }
      }
    }

    return false;
  }

  private updateStatus(): void {
    if (this.filteredItems && this.filteredItems.length > 0) {
      const count = Math.min(this.filteredItems.length, this.numberOfItemsToShow);
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
    const el = document.getElementById(this.listItemIdPrefix + this.listKeyManager.activeItemIndex);
    /* istanbul ignore else */
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }
  }

  private hideOverlay(): void {
    this.overlayVisible = false;
    this.listItemsOverlayRef.dispose();
  }

  private displayOverlay(): void {
    this.overlayVisible = true;

    const positionStrategy = this.overlay.position()
      .connectedTo(
        this.overlayOrigin.elementRef,
        {originX: 'start', originY: 'bottom'},
        {overlayX: 'start', overlayY: 'top'},
      );

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
