export interface ListOverlayItem {
  id: string;
  displayText: string;
  item?: object;
}

export interface NoResultOptions {
  display?: boolean;
  message?: string;
}

export interface ListOverlayOptions {
  id?: string;
  listMaxHeight?: string;
  noResultOptions?: NoResultOptions;
  numberOfItemsToShow?: number;
  placeholder?: string;
}
