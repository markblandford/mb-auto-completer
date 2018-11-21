import { ProviderService } from './services/provider/provider.service';
import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mb-auto-complete';

  public providers: any;

  constructor(private providerService: ProviderService) {}

  ngOnInit() {
    this.providers = this.providerService.getProviders();
  }
}
