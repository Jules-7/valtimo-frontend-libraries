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
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {SortState} from '@valtimo/document';
import {
  IconService,
  PaginationModel,
  PaginationTranslations,
  TableHeaderItem,
  TableItem,
} from 'carbon-components-angular';
import {get as _get} from 'lodash';
import {NGXLogger} from 'ngx-logger';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  map,
  Observable,
  of,
  startWith,
  Subscription,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {BorderFull16, List16} from '@carbon/icons';
import {
  CarbonPaginatorConfig,
  CarbonTableBatchText,
  CarbonTableTranslations,
  ColumnConfig,
  DEFAULT_PAGINATION,
  DEFAULT_PAGINATOR_CONFIG,
  Pagination,
  ViewType,
} from '../../models';
import {ViewContentService} from '../view-content/view-content.service';

@Component({
  selector: 'valtimo-carbon-list',
  templateUrl: './carbon-list.component.html',
  styleUrls: ['./carbon-list.component.scss'],
})
export class CarbonListComponent<T> implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  @HostBinding('attr.data-carbon-theme') public theme = 'g10';

  private static PAGINATION_SIZE = 'PaginationSize';

  private _items: Array<T>;
  public items$ = new BehaviorSubject<TableItem[][]>([]);
  @Input() set items(value: Array<T>) {
    this._items = value;
    if (!this._fields) {
      return;
    }

    this.items$.next(this.getTableItems());
  }
  public get items(): Array<T> {
    return this._items;
  }

  private _fields: ColumnConfig[];
  public fields$: Observable<TableHeaderItem[]> = of([]);
  @Input() set fields(value: ColumnConfig[]) {
    this._fields = value;
    const translationStreams: Observable<string>[] = value.map((column: ColumnConfig) =>
      this.translateService.stream(column.label)
    );

    this.fields$ = combineLatest(translationStreams).pipe(
      switchMap(translationResults =>
        this.sort$.pipe(map((sortState: SortState) => ({translationResults, sortState})))
      ),
      map((res: {translationResults: string[]; sortState: SortState}) => [
        ...res.translationResults.map(
          (translation: string, index: number) =>
            new TableHeaderItem({
              data: translation,
              sortable: !!value[index].sortable,
              className: value[index].className ?? '',
              key: value[index].key,
              sorted: res.sortState.isSorting && value[index].key === res.sortState.state.name,
              ascending:
                value[index].key === res.sortState.state.name &&
                res.sortState.state.direction === 'ASC',
            })
        ),
      ])
    );

    if (!this._items.length) {
      return;
    }

    this.items$.next(this.getTableItems());
  }

  private readonly _defaultTranslations: CarbonTableTranslations = {
    select: {single: 'interface.table.singleSelect', multiple: 'interface.table.multipleSelect'},
    pagination: {
      itemsPerPage: 'interface.table.itemsPerPage',
      totalItems: 'interface.table.totalItems',
    },
  };
  private _tableTranslations$: BehaviorSubject<CarbonTableTranslations> = new BehaviorSubject(
    this._defaultTranslations
  );
  @Input() set tableTranslations(value: Partial<CarbonTableTranslations>) {
    this._tableTranslations$.next({...this._defaultTranslations, ...value});
  }

  public paginationTranslations$: Observable<Partial<PaginationTranslations>> =
    this._tableTranslations$.pipe(
      switchMap((translations: CarbonTableTranslations) =>
        combineLatest([
          this.translateService.stream(translations.pagination.itemsPerPage),
          this.translateService.stream(translations.pagination.totalItems),
          this.translateService.stream('interface.table.ofLastPage'),
          this.translateService.stream('interface.table.ofLastPages'),
        ])
      ),
      map(([ITEMS_PER_PAGE, TOTAL_ITEMS, OF_LAST_PAGE, OF_LAST_PAGES]) => ({
        ITEMS_PER_PAGE,
        TOTAL_ITEMS,
        OF_LAST_PAGE,
        OF_LAST_PAGES,
      }))
    );

  public batchText$: Observable<CarbonTableBatchText> = this._tableTranslations$.pipe(
    switchMap((translations: CarbonTableTranslations) =>
      combineLatest([
        this.translateService.stream(translations.select.single),
        this.translateService.stream(translations.select.multiple),
      ]).pipe(
        startWith(
          this.translateService.instant(translations.select.single),
          this.translateService.instant(translations.select.multiple)
        )
      )
    ),
    map(([SINGLE, MULTIPLE]) => ({SINGLE, MULTIPLE}))
  );

  public paginationModel: PaginationModel;
  @Input() paginatorConfig: CarbonPaginatorConfig = DEFAULT_PAGINATOR_CONFIG;
  private _pagination: Pagination;
  @Input() public set pagination(value: Partial<Pagination>) {
    if (!this._pagination) {
      this._pagination = {...DEFAULT_PAGINATION, ...value};
    }
    this._pagination = {...this._pagination, ...value};
    this.buildPaginationModel();
  }
  public get pagination(): Pagination {
    return this._pagination;
  }
  @Input() viewMode?: boolean;
  @Input() isSearchable?: boolean;
  @Input() header?: boolean;
  @Input() actions: any[] = [];
  @Input() paginationIdentifier?: string;
  @Input() initialSortState: SortState;
  public lastColumnHeaderItem: TableHeaderItem;
  @Input() lastColumnTemplate?: TemplateRef<any>;

  @Output() rowClicked = new EventEmitter<any>();
  @Output() paginationClicked = new EventEmitter<number>();
  @Output() paginationSet = new EventEmitter<any>();
  @Output() search = new EventEmitter<any>();
  @Output() sortChanged = new EventEmitter<SortState>();

  public headerProvided = false;
  public viewListAs: string;
  public searchModel: string;
  @ViewChild('searchBox') searchBox: ElementRef;

  readonly sort$ = new BehaviorSubject<SortState>({
    state: {name: '', direction: 'DESC'},
    isSorting: false,
  });

  public searchFormControl = new FormControl('');

  private readonly _subscriptions = new Subscription();

  public get numberOfColumns(): number {
    return this._fields?.length + (this.lastColumnTemplate ? 1 : 0);
  }

  constructor(
    private translateService: TranslateService,
    private viewContentService: ViewContentService,
    private logger: NGXLogger,
    private readonly iconService: IconService
  ) {
    this.viewListAs = localStorage.getItem('viewListAs') || 'table';

    this.iconService.registerAll([BorderFull16, List16]);
  }
  public ngOnInit(): void {
    if (this.lastColumnTemplate) {
      this.lastColumnHeaderItem = new TableHeaderItem({data: '', key: ''});
    }

    if (this.pagination) {
      this.loadPaginationSize();
    }

    if (this.initialSortState) {
      this.sort$.next(this.initialSortState);
    }

    this._subscriptions.add(
      this.searchFormControl.valueChanges
        .pipe(debounceTime(500))
        .subscribe((searchString: string | null) => {
          if (this.search.observed) {
            this.search.emit(searchString);
          } else {
            this.searchModel = searchString ?? '';
          }
        })
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    // if (changes.items && changes.items.currentValue) {
    //   this.transformListItemsMatchFields();
    // }

    if (changes?.initialSortState?.currentValue) {
      this.sort$.next(changes?.initialSortState?.currentValue);
    }
  }

  public ngAfterViewInit(): void {
    // if (this.isSearchable) {
    //   fromEvent(this.searchBox.nativeElement, 'keyup')
    //     .pipe(debounceTime(500))
    //     .subscribe(() => {
    //       const value = this.searchBox.nativeElement.value;
    //       if (this.search.observed) {
    //         // custom search callbak is specified, perhaps to query on the server side
    //         this.search.emit(value);
    //       } else {
    //         this.searchModel = value;
    //       }
    //     });
    // }
  }

  public ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  public onClickRow(item: T): void {
    this.rowClicked.emit(item);
  }

  public switchView(type: 'table' | 'title'): void {
    localStorage.setItem('viewListAs', type);
    this.viewListAs = type;
  }

  // public getTotalPageCount() {
  //   return Math.ceil(this.pagination.collectionSize / this.pagination.size);
  // }

  public onSelectPage(page: number): void {
    if (!this.paginationModel.pageLength) {
      return;
    }

    if (this.pagination.size !== this.paginationModel.pageLength) {
      this.setPaginationSize(this.paginationModel.pageLength.toString());
      return;
    }

    this.onClickPagination(page);
  }

  public handleFieldClick(key: string, sortable: boolean): void {
    if (!sortable) {
      return;
    }

    this.sort$.pipe(take(1)).subscribe(sort => {
      let newState: SortState;

      if (sort.state.name === key) {
        if (!sort.isSorting) {
          newState = {state: {...sort.state, direction: 'DESC'}, isSorting: true};
        } else {
          if (sort.state.direction === 'DESC') {
            newState = {...sort, state: {...sort.state, direction: 'ASC'}};
          } else {
            newState = {state: {...sort.state, direction: 'DESC'}, isSorting: false};
          }
        }
      } else {
        newState = {state: {name: key, direction: 'DESC'}, isSorting: true};
      }

      this.sort$.next(newState);
      this.sortChanged.emit(newState);
    });
  }

  private loadPaginationSize(): void {
    const entries = localStorage.getItem(
      `${this.paginationIdentifier}${CarbonListComponent.PAGINATION_SIZE}`
    );
    if (entries !== null) {
      this.pagination = {size: +entries};
      // this.pagination.size = +entries;
      this.paginationSet.emit(+entries);
      this.logger.debug('Pagination loaded from local storage for this list. Current: ', entries);
    } else {
      this.logger.debug(
        'Pagination does NOT exist in local storage for this list. Will use default. Change it to create an entry.'
      );
      this.paginationSet.emit(10);
    }
  }

  private buildPaginationModel(): void {
    this.paginationModel = {
      currentPage: this.pagination.page,
      totalDataLength: +this.pagination.collectionSize,
      pageLength: this.pagination.size,
    };
  }

  private resolveObject(definition: any, obj: any) {
    const definitionKey = definition.key;
    const customPropString = '$.';
    const key = definitionKey.includes(customPropString)
      ? definitionKey.split(customPropString)[1]
      : definitionKey;
    const resolvedObjValue = _get(obj, key, null);
    return this.viewContentService.get(resolvedObjValue, definition);
  }

  private getTableItems(): TableItem[][] {
    return this._items.map((item: T, index: number) =>
      this._fields.map((column: ColumnConfig) => {
        switch (column.type) {
          // case ViewType.ACTION:
          //   return new TableItem({
          //     data: {actions: column.actions, item},
          //     template: this.actionsMenu,
          //   });
          case ViewType.TEMPLATE:
            return new TableItem({
              data: {item, index},
              template: column.template,
            });
          default:
            return new TableItem({data: this.resolveObject(column, item) ?? '-'});
        }
      })
    );
  }

  // private transformListItemsMatchFields() {
  //   if (this.items && this.fields) {
  //     this.items.forEach(item => {
  //       item.listItemFields = this.fields.map(field => ({
  //         key: field.key,
  //         label: field.label,
  //         type: field.type || '',
  //         value: this.resolveObject(field, item),
  //       }));
  //     });
  //   }
  // }

  private setPaginationSize(numberOfEntries: string): void {
    localStorage.setItem(
      `${this.paginationIdentifier}${CarbonListComponent.PAGINATION_SIZE}`,
      numberOfEntries
    );
    this.pagination = {size: +numberOfEntries};
    // this.pagination.size = +numberOfEntries;
    this.logger.debug('Pagination set in local storage for this list: ', numberOfEntries);
    this.paginationSet.emit(numberOfEntries);
  }

  private onClickPagination(page: number) {
    this.pagination = {page};
    this.paginationClicked.emit(page);
  }
}
