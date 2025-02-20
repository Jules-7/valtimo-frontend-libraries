/*
 * Copyright 2015-2023 Ritense BV, the Netherlands.
 *
 * Licensed under EUPL, Version 1.2 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgbPaginationModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {CardModule} from '../card/card.module';
import {CarbonListComponent} from './carbon-list.component';
import {CarbonListFilterPipe} from './CarbonListFilterPipe.directive';
import {CarbonNoResultsComponent} from './no-results/carbon-no-results.component';
import {
  ButtonModule,
  ContentSwitcherModule,
  DialogModule,
  IconModule,
  PaginationModule,
  TableModule,
} from 'carbon-components-angular';

@NgModule({
  declarations: [CarbonListComponent, CarbonListFilterPipe, CarbonNoResultsComponent],
  imports: [
    CardModule,
    CommonModule,
    FormsModule,
    NgbPaginationModule,
    PaginationModule,
    TableModule,
    TranslateModule,
    ReactiveFormsModule,
    ContentSwitcherModule,
    IconModule,
    ButtonModule,
    DialogModule,
  ],
  exports: [CarbonListComponent, CarbonListFilterPipe, CarbonNoResultsComponent],
})
export class CarbonListModule {}
