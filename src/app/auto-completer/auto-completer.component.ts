import { Component } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';

import { ListOverlayHandler } from './list-overlay-handler/list-overlay-handler';
import { AutoCompleterItem } from '.';

@Component({
  selector: 'app-auto-completer',
  templateUrl: './auto-completer.component.html',
  styleUrls: ['./auto-completer.component.scss']
})
export class AutoCompleterComponent extends ListOverlayHandler<AutoCompleterItem> {

  constructor(protected overlay: Overlay) {
    super(overlay);
  }

  protected updateFilteredList(): void {
    const currentFilter = this.filtered.length > 0 ? JSON.stringify(this.filtered) : JSON.stringify(this.allItems);
    this.filtered = this.allItems.filter(p =>
      (p as AutoCompleterItem).searchableText.toLowerCase().includes(this.searchInput.toLowerCase())
    );

    if (currentFilter !== JSON.stringify(this.filtered)) {
      this.filteredItems.emit(this.filtered);
    }
    this.filteredList.next(this.filtered);

    this.updateStatus();
  }
}
