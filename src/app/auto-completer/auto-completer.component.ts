import { ListItemComponent } from './../list-item/list-item.component';
import { Component, EventEmitter, QueryList, ViewChildren, OnInit, AfterViewInit, Input, ViewChild, Output  } from '@angular/core';
import { ListKeyManager } from '@angular/cdk/a11y';
import { Overlay, OverlayConfig, OverlayRef, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ComponentPortal, Portal, TemplatePortalDirective } from '@angular/cdk/portal';
import { UP_ARROW, DOWN_ARROW, ENTER, ESCAPE } from '@angular/cdk/keycodes';
import { Provider } from '../models/provider';

import * as faker from 'faker';

@Component({
  selector: 'app-auto-completer',
  templateUrl: './auto-completer.component.html',
  styleUrls: ['./auto-completer.component.scss']
})
export class AutoCompleterComponent implements OnInit, AfterViewInit {
  private allListItems: Provider[];
  private listItemsOverlayRef: OverlayRef;

  @Input() id = '0';
  @Input() items: [];
  @Input() numberOfItemsToShow = 10;
  @Input() placeHolder = 'search';
  @Output() itemSelected = new EventEmitter();

  public filteredList: Provider[];
  public searchQuery = '';
  public overlayVisible = false;

  listKeyManager: ListKeyManager<any>;
  @ViewChild(CdkOverlayOrigin) overlayOrigin: CdkOverlayOrigin;
  @ViewChild('listItemsTemplate') listItemsTemplate: TemplatePortalDirective;
  @ViewChildren(ListItemComponent) listItemComponents: QueryList<ListItemComponent>;

  constructor(private overlay: Overlay) { }

  ngOnInit(): void {
    const providers: Provider[] = Array(20).fill(null).map(this.createProvider);
    this.allListItems = providers;
  }

  ngAfterViewInit(): void {
    this.listKeyManager = new ListKeyManager<any>(this.listItemComponents).withWrap();
    this.initKeyManagerHandlers();
  }

  private createProvider(): Provider {
    return <Provider>{ name: faker.company.companyName() };
  }

  private initKeyManagerHandlers() {
    this.listKeyManager
      .change
      .subscribe(activeIndex => {
        // when the navigation item changes, we get new activeIndex
        return this.setActiveListItems(activeIndex);
      });
  }

  public showItem(item) {
    this.itemSelected.emit(item);
    this.hideOverlay();
  }

  public setActiveListItems(activeItemIndex): void {
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
      this.filteredList = this.allListItems.filter(p => p.name.toLowerCase().includes(this.searchQuery.toLowerCase()));

      this.showOverlay();

      if (this.listKeyManager) {
        if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
          this.listKeyManager.onKeydown(event);
        } else if (event.keyCode === ENTER) {
          this.listKeyManager.activeItem.selectItem();
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
