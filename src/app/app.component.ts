import { Provider } from './models/provider';
import { Component, OnInit } from '@angular/core';

import * as faker from 'faker';
import { Observable, of } from 'rxjs';
import { AutoCompleterItem, AutoCompleterOptions, NoResultOptions } from './auto-completer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public providers$: Observable<AutoCompleterItem[]> = of([]);
  public filtered: AutoCompleterItem[] = [];
  public options = <AutoCompleterOptions>{
    numberOfItemsToShow: 10,
    listMaxHeight: '200'
  };
  public options2 = <AutoCompleterOptions>{
    id: 'x',
    numberOfItemsToShow: 5,
    placeholder: 'search...',
    noResultOptions: <NoResultOptions>{ display: true, message: 'What The???'}
  };

  constructor() {}

  ngOnInit() {
    const rawProviders = Array(20).fill(null).map(this.createProvider);

    const items = [];
    rawProviders.forEach(p => {
      items.push(<AutoCompleterItem>{ id: p.name, displayText: p.name, searchableText: p.name, item: p });
    });

    this.providers$ = of(items);
  }

  private createProvider(): Provider {
    return <Provider>{ name: faker.company.companyName() };
  }

  public providerSelected(item: AutoCompleterItem) {
    alert((<Provider>item.item).name);
  }

  public onFilterUpdate($event) {
    this.filtered = $event;
  }
}
