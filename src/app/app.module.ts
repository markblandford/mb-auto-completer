import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AutoCompleterComponent } from './auto-completer/auto-completer.component';
import { ListItemComponent } from './list-item/list-item.component';
import { ProviderService } from './services/provider/provider.service';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    AutoCompleterComponent,
    ListItemComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    OverlayModule,
    PortalModule
  ],
  providers: [
    ProviderService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
