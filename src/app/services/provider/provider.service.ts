import { Injectable } from '@angular/core';
import { Provider } from 'src/app/models/provider';

import * as faker from 'faker';

@Injectable()
export class ProviderService {

  constructor() { }

  getProviders(): Provider[] {
    const providers: Provider[] = Array(20).fill(null).map(this.createProvider);
    return providers;
  }

  private createProvider(): Provider {
    return <Provider>{ name: faker.company.companyName() };
  }
}
