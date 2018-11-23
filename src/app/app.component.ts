import { AutoCompleterItem } from './auto-completer/auto-completer-item';
import { Provider } from './models/provider';
import { Component, OnInit } from '@angular/core';

import * as faker from 'faker';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mb-auto-complete';

  public providers$: Observable<AutoCompleterItem[]> = of([]);

  constructor() {}

  ngOnInit() {
    const rawProviders = Array(20).fill(null).map(this.createProvider);

    const items = [];
    rawProviders.forEach(p => {
      items.push(<AutoCompleterItem>{ id: p.name, text: p.name, item: p });
    });

    this.providers$ = of(items);
  }

  private createProvider(): Provider {
    return <Provider>{ name: faker.company.companyName() };
  }

  public providerSelected(item: AutoCompleterItem) {
    alert((<Provider>item.item).name);
  }
}
