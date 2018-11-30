export interface AutoCompleterItem {
  id: string;
  displayText: string;
  searchableText: string;
  item?: object;
}

export interface NoResultOptions {
  display?: boolean;
  message?: string;
}

export interface AutoCompleterOptions {
  id?: string;
  listMaxHeight?: string;
  noResultOptions?: NoResultOptions;
  numberOfItemsToShow?: number;
  placeholder?: string;
}
