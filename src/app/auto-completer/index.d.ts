import { ListOverlayItem } from './list-overlay-handler/list-item';

export interface AutoCompleterItem extends ListOverlayItem {
  searchableText: string;
}
