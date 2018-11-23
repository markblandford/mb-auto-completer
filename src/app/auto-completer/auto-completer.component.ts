import {
  Component,
  EventEmitter,
  QueryList,
  ViewChildren,
  AfterViewInit,
  Input,
  ViewChild,
  Output,
  forwardRef,
  OnChanges,
  SimpleChanges,
  OnInit
} from '@angular/core';
import { ListKeyManager } from '@angular/cdk/a11y';
import {
  Overlay,
  OverlayConfig,
  OverlayRef,
  CdkOverlayOrigin
} from '@angular/cdk/overlay';
import { TemplatePortalDirective } from '@angular/cdk/portal';
import {
  UP_ARROW,
  DOWN_ARROW,
  ENTER,
  ESCAPE
} from '@angular/cdk/keycodes';

import { ListItemComponent } from './list-item/list-item.component';
import { AutoCompleterItem } from './auto-completer-item';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-auto-completer',
  templateUrl: './auto-completer.component.html',
  styleUrls: ['./auto-completer.component.scss']
})
export class AutoCompleterComponent implements OnInit, AfterViewInit {
  private listItemsOverlayRef: OverlayRef;
  private allItems: AutoCompleterItem[];
  private firstItem: ListItemComponent;

  @Input() id = '0';
  @Input() items$: Observable<AutoCompleterItem[]>;
  @Input() numberOfItemsToShow = 10;
  @Input() placeHolder = 'search';
  @Input() listMaxHeight = 'auto';
  @Output() itemSelected = new EventEmitter();

  public filteredList: AutoCompleterItem[];
  public searchQuery = '';
  public overlayVisible = false;

  listKeyManager: ListKeyManager<any>;
  @ViewChild(CdkOverlayOrigin) overlayOrigin: CdkOverlayOrigin;
  @ViewChild('listItemsTemplate') listItemsTemplate: TemplatePortalDirective;
  @ViewChildren(forwardRef(() => ListItemComponent)) listItemComponents: QueryList<ListItemComponent>;

  constructor(private overlay: Overlay) { }

  ngOnInit(): void {
    this.items$.subscribe(val => {
      this.allItems = val;
    });
  }

  ngAfterViewInit(): void {
    this.listKeyManager = new ListKeyManager<any>(this.listItemComponents).withWrap();
    this.initKeyManagerHandlers();
    this.initListItems();
  }

  private initKeyManagerHandlers() {
    this.listKeyManager
      .change
      .subscribe(activeIndex => {
        // when the navigation item changes, we get new activeIndex
        return this.setActiveListItems(activeIndex);
      });
  }

  private initListItems() {
    this.listItemComponents.changes.subscribe(() => {
      this.firstItem = this.listItemComponents.first;
    });
  }

  public showItem(item) {
    this.itemSelected.emit(item);
    this.hideOverlay();
  }

  public setActiveListItems(activeItemIndex: number): void {
    this.listItemComponents.map((item, index) => {
      // set isActive to true for the active item otherwise false
      item.setActive(activeItemIndex === index);
    });
  }

  public inputKeydown(event: KeyboardEvent): void {
    // stop the cursor moving in the input box
    if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
      event.preventDefault();
    }
  }

  public inputKeyup(event: KeyboardEvent): void {
    event.stopImmediatePropagation();

    if (event.keyCode === ESCAPE) {
      this.clearSearchQuery();
    } else {
      this.filteredList = this.allItems.filter(p => p.text.toLowerCase().includes(this.searchQuery.toLowerCase()));

      this.showOverlay();

      if (this.listKeyManager) {
        if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
          this.listKeyManager.onKeydown(event);
        } else if (event.keyCode === ENTER) {
          console.log(this.listItemComponents);
          if (this.listKeyManager.activeItem) {
            this.listKeyManager.activeItem.selectItem();
          }
        }
      }
    }
  }

  private clearSearchQuery(): void {
    this.searchQuery = '';
    this.hideOverlay();
  }

  public showOverlay(): boolean {
    if (!this.overlayVisible && this.filteredList) {
      this.displayOverlay();

      return true;
    }

    return false;
  }

  private selectFirstItem(): void {
    /* istanbul ignore else */
    if (this.listItemComponents) {
      console.log(this.listItemComponents);
      console.log(this.listItemComponents[0]);
      console.log(this.listItemComponents.first);
      this.firstItem.setActive(true);
      // this.listItemComponents.changes.subscribe(() => {
      //   this.listItemComponents.first.setActive(true);
      // });
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
      positionStrategy: positionStrategy
    });

    this.listItemsOverlayRef = this.overlay.create(config);

    this.listItemsOverlayRef.backdropClick().subscribe(() => {
      this.hideOverlay();
    });

    this.listItemsOverlayRef.attach(this.listItemsTemplate);
  }
}
