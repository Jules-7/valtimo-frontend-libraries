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

import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {TabEnum} from './tab.enum';

@Injectable({
  providedIn: 'root',
})
export class TabService {
  private _currentTab$ = new BehaviorSubject<TabEnum>(TabEnum.GENERAL);

  public get currentTab$(): Observable<TabEnum> {
    return this._currentTab$.asObservable();
  }

  public set currentTab(tab: TabEnum) {
    this._currentTab$.next(tab);
  }
}
