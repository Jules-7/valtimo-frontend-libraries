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
import {Direction, SortState} from '@valtimo/components';
import {ConfigService, DefinitionColumn} from '@valtimo/config';

@Injectable({
  providedIn: 'root',
})
export class DossierService {
  private readonly definitions: any;

  constructor(private readonly configService: ConfigService) {
    this.definitions = configService.config.definitions;
  }

  getImplementationEnvironmentDefinitions(name: string) {
    return this.definitions.dossiers.find(definition => definition.name === name);
  }

  getInitialSortState(columns: Array<DefinitionColumn>): SortState {
    const defaultColumn = columns.find(column => column.default);
    const isSorting = defaultColumn?.default === 'ASC' || defaultColumn?.default === 'DESC';
    const direction: Direction =
      typeof !defaultColumn || defaultColumn.default === 'boolean'
        ? 'DESC'
        : (defaultColumn.default as any as Direction);

    return {
      isSorting,
      state: {
        name: defaultColumn ? defaultColumn.propertyName : columns[0].propertyName,
        direction,
      },
    };
  }
}
