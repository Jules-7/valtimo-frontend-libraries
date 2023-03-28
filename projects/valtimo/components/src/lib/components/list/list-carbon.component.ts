/*
 * Copyright 2015-2020 Ritense BV, the Netherlands.
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

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {Direction, SortState} from '@valtimo/document';
import {TableHeaderItem, TableItem, TableModel} from 'carbon-components-angular';
import {NGXLogger} from 'ngx-logger';
import {BehaviorSubject, fromEvent} from 'rxjs';
import {debounceTime, take} from 'rxjs/operators';
import {ViewContentService} from '../view-content/view-content.service';

@Component({
  selector: 'valtimo-list-carbon',
  templateUrl: './list-carbon.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListCarbonComponent implements OnChanges, OnInit, AfterViewInit {
  private static PAGINATION_SIZE = 'PaginationSize';

  @Input() items: Array<any>;
  @Input() fields: Array<any>;
  @Input() pagination?: any;
  @Input() viewMode?: boolean;
  @Input() isSearchable?: boolean;
  @Input() header?: boolean;
  @Input() actions: any[] = [];
  @Input() paginationIdentifier?: string;
  @Input() initialSortState: SortState;
  @Input() lastColumnTemplate?: TemplateRef<any>;
  @Input() striped?: boolean = true;
  @Input() itemsPerPageOptions?: Array<number> = [10, 25, 50, 100];

  @Output() rowClicked: EventEmitter<any> = new EventEmitter();
  @Output() paginationClicked: EventEmitter<any> = new EventEmitter();
  @Output() paginationSet: EventEmitter<any> = new EventEmitter();
  @Output() search: EventEmitter<any> = new EventEmitter();
  @Output() sortChanged: EventEmitter<SortState> = new EventEmitter();

  //TEMP CARBON LIST STUFF
  public tableData = [];
  public tableModel = new TableModel();

  public headerProvided = false;
  public viewListAs: string;
  public searchModel: string;
  public regExpStringRemoveUnderscore = /_/g;
  @ViewChild('searchBox2') searchBox: ElementRef;

  readonly sort$ = new BehaviorSubject<SortState>({
    state: {name: '', direction: 'DESC'},
    isSorting: false,
  });

  constructor(private viewContentService: ViewContentService, private logger: NGXLogger) {
    this.viewListAs = localStorage.getItem('viewListAs') || 'table';
  }

  loadPaginationSize(): void {
    const entries = localStorage.getItem(
      `${this.paginationIdentifier}${ListCarbonComponent.PAGINATION_SIZE}`
    );
    if (entries !== null) {
      this.pagination.size = +entries;
      this.paginationSet.emit(+entries);
      this.logger.debug('Pagination loaded from local storage for this list. Current: ', entries);
    } else {
      this.logger.debug(
        'Pagination does NOT exist in local storage for this list. Will use default. Change it to create an entry.'
      );
      this.paginationSet.emit(10);
    }
    this.tableModel.pageLength = this.pagination.size
  }

  setPaginationSize(numberOfEntries: string) {
    localStorage.setItem(
      `${this.paginationIdentifier}${ListCarbonComponent.PAGINATION_SIZE}`,
      numberOfEntries
    );
    this.pagination.size = numberOfEntries;
    this.logger.debug('Pagination set in local storage for this list: ', numberOfEntries);
    this.paginationSet.emit(numberOfEntries);
    this.selectPage(this.pagination.page);
  }

  ngOnInit() {
    if (this.pagination) {
      this.loadPaginationSize();
    }

    if (this.initialSortState) {
      this.sort$.next(this.initialSortState);
    }

    //TEMP CARBON STUFF
    this.setTableData();
    this.tableModel.data = [];
    for (let field of this.fields) {
      this.tableModel.header.push(new TableHeaderItem({data: field.label}))
    }
    for (let action of this.actions) {
      this.tableModel.header.push(new TableHeaderItem({data: action.columnName}))
    }
    this.tableModel.pageLength = this.pagination.size || 10;
    this.tableModel.totalDataLength = this.pagination.collectionSize;
    console.log('initpage: ', this.pagination.page);
    this.selectPage(this.pagination.page);
  }

  setTableData() {
    this.tableData = [];
    this.items.forEach((item, index) => {
      let newRow = [];
      for (let listItemField of item.listItemFields) {
        newRow.push(new TableItem({data: listItemField.value}))
      }
      this.tableData.push(newRow);
    });
  }

  //TEMP CARBON STUFF
  selectPage(page) {
    console.log('page: ', page);
    console.log('data: ', this.tableData);
    this.tableModel.currentPage = page;
    const fullPage = [];
    for (
      let i = 0;
      i < this.tableModel.pageLength && i < (this.tableModel.totalDataLength - ((page - 1) * this.tableModel.pageLength));
      i++
    ) {
      fullPage.push(this.tableData[i]);
      this.tableModel.data = fullPage;
    }
  }

  //rowClicked(event) {}

  onClickSort(event) {
    console.log('sort clicked: ', event);
  }
  //END TEMP CARBON STUFF

  ngOnChanges(changes: SimpleChanges) {
    console.log('searchModel: ', this.searchModel);
    if (changes.items && changes.items.currentValue) {
      this.transformListItemsMatchFields();
    }

    if (changes?.initialSortState?.currentValue) {
      this.sort$.next(changes?.initialSortState?.currentValue);
    }

    this.setTableData();
    this.selectPage(this.pagination.page);
  }

  ngAfterViewInit() {
    if (this.isSearchable) {
      fromEvent(this.searchBox.nativeElement, 'keyup')
        .pipe(debounceTime(500))
        .subscribe(() => {
          const value = this.searchBox.nativeElement.value;
          if (this.search.observers.length > 0) {
            // custom search callbak is specified, perhaps to query on the server side
            this.search.emit(value);
          } else {
            this.searchModel = value;
          }
        });
    }
  }

  public transformListItemsMatchFields() {
    if (this.items && this.fields) {
      this.items.forEach(item => {
        item.listItemFields = this.fields.map(field => ({
          key: field.key,
          label: field.label,
          type: field.type || '',
          value: this.resolveObject(field, item),
        }));
      });
    }
  }

  public onClickRow(item) {
    console.log('rowclick: ', item);
    this.rowClicked.emit(item);
  }

  public resolveObject(definition: any, obj: any) {
    const definitionKey = definition.key;
    const customPropString = '$.';
    const key = definitionKey.includes(customPropString)
      ? definitionKey.split(customPropString)[1]
      : definitionKey;
    const resolvedObjValue = key.split('.').reduce(function (prev, curr) {
      return prev ? prev[curr] : null;
    }, obj || self);
    return this.viewContentService.get(resolvedObjValue, definition);
  }

  public switchView(type) {
    localStorage.setItem('viewListAs', type);
    this.viewListAs = type;
  }

  public getTotalPageCount() {
    return Math.ceil(this.pagination.collectionSize / this.pagination.size);
  }

  public onClickPagination(page) {
    this.pagination.size = this.tableModel.pageLength;
    this.setPaginationSize(this.pagination.size);
    this.paginationClicked.emit(page);
    // this.pagination.page = page;
    console.log('onclickpage: ', page, this.pagination.size, this.tableModel.pageLength, this.pagination.page);
  }

  public handleFieldClick(key: string, sortable: boolean): void {
    const desc: Direction = 'DESC';
    const asc: Direction = 'ASC';

    if (!sortable) {
      return;
    }

    this.sort$.pipe(take(1)).subscribe(sort => {
      let newState: SortState;

      if (sort.state.name === key) {
        if (!sort.isSorting) {
          newState = {state: {...sort.state, direction: desc}, isSorting: true};
        } else {
          if (sort.state.direction === desc) {
            newState = {...sort, state: {...sort.state, direction: asc}};
          } else {
            newState = {state: {...sort.state, direction: desc}, isSorting: false};
          }
        }
      } else {
        newState = {state: {name: key, direction: desc}, isSorting: true};
      }

      this.sort$.next(newState);
      this.sortChanged.emit(newState);
    });
  }
}
