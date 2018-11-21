import { ListItemComponent } from './../list-item/list-item.component';
import { Component, QueryList, ViewChildren, OnInit, AfterViewInit, Input  } from '@angular/core';
import { ListKeyManager } from '@angular/cdk/a11y';
import { UP_ARROW, DOWN_ARROW, ENTER } from '@angular/cdk/keycodes';
import { Provider } from '../models/provider';

import * as faker from 'faker';

@Component({
  selector: 'app-auto-completer',
  templateUrl: './auto-completer.component.html',
  styleUrls: ['./auto-completer.component.scss']
})
export class AutoCompleterComponent implements OnInit, AfterViewInit {
  private allListItems: Provider[];

  @Input() items: [];
  @Input() numberOfItemsToShow = 10;

  public filteredList: Provider[];
  public searchQuery: string;

  keyboardEventsManager: ListKeyManager<any>;
  @ViewChildren(ListItemComponent) listItemComponents: QueryList<ListItemComponent>;

  constructor() { }

  ngOnInit(): void {
    const providers: Provider[] = Array(20).fill(null).map(this.createProvider);
    this.allListItems = providers;
  }

  ngAfterViewInit(): void {
    this.keyboardEventsManager = new ListKeyManager<any>(this.listItemComponents);
    this.initKeyManagerHandlers();
  }

  private createProvider(): Provider {
    return <Provider>{ name: faker.company.companyName() };
  }

  public showItem(item) {
    alert(`Provider: ${item.name}`);
  }

  initKeyManagerHandlers() {
    this.keyboardEventsManager
      .change
      .subscribe((activeIndex) => {
        // when the navigation item changes, we get new activeIndex
        this.listItemComponents.map((item, index) => {
          // set the isActive `true` for the appropriate list item and `false` for the rest
          item.setActive(activeIndex === index);
          return item;
        });
      });
  }

  inputKeyup(event: KeyboardEvent) {
    event.stopImmediatePropagation();

    this.filteredList = this.allListItems.filter(p => p.name.toLowerCase().includes(this.searchQuery.toLowerCase()));

    if (this.keyboardEventsManager) {
      if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
        this.keyboardEventsManager.onKeydown(event);
        return false;
      } else if (event.keyCode === ENTER) {
        this.keyboardEventsManager.activeItem.selectItem();
        return false;
      }
    }
  }
}
