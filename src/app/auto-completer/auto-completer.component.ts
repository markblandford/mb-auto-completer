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

import { ListItemComponent } from './list-item/list-item.component';
import { AutoCompleterItem } from './auto-completer-item';

@Component({
  selector: 'app-auto-completer',
  templateUrl: './auto-completer.component.html',
  styleUrls: ['./auto-completer.component.scss']
})
export class AutoCompleterComponent implements OnInit, AfterViewInit {
  private listItemsOverlayRef: OverlayRef;
  private listKeyManager: ActiveDescendantKeyManager<ListItemComponent>;
  private allItems: AutoCompleterItem[];

  public filteredItems: AutoCompleterItem[] = [];
  public overlayVisible = false;
  public searchQuery = '';
  public filterStatus = '';
  public activeItemIndex = -1;

  @Input() id = '0';
  @Input() items$: Observable<AutoCompleterItem[]>;
  @Input() numberOfItemsToShow = 10;
  @Input() placeHolder = 'search';
  @Input() listMaxHeight = 'auto';
  @Output() itemSelected = new EventEmitter();

  @ViewChild(CdkOverlayOrigin) overlayOrigin: CdkOverlayOrigin;
  @ViewChild('listItemsTemplate') listItemsTemplate: TemplatePortalDirective;
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

  public showItem(item) {
    this.itemSelected.emit(item);
    this.hideOverlay();
  }

  public inputKeydown(event: KeyboardEvent): void {
    // stop the cursor moving in the input box
    if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
      event.preventDefault();
    }
  }

  public inputKeyup(event: KeyboardEvent): void {
    if (event.keyCode === ESCAPE) {
      this.hideOverlay();
    } else {
      this.showOverlay();

      this.filteredItems = this.allItems.filter(p => p.searchableText.toLowerCase().includes(this.searchQuery.toLowerCase()));

      this.updateStatus();

      if (this.listKeyManager) {
        if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
          this.listKeyManager.onKeydown(event);

          this.updateActiveItemId();

        } else if (event.keyCode === ENTER) {
          if (this.listKeyManager.activeItem) {
            this.listKeyManager.activeItem.selectItem();
          }
        }
      }
    }
  }

  public updateStatus(): void {
    if (this.filteredItems && this.filteredItems.length > 0) {
      const count = Math.min(this.filteredItems.length, this.numberOfItemsToShow);
      this.filterStatus = count + ' results found';
    } else {
      this.filterStatus = 'no results found';
    }
  }

  public setActiveItem(index: number): void {
    this.listKeyManager.setActiveItem(index);
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
