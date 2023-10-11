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

import {ComponentFactoryResolver, ComponentRef, ViewContainerRef} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {take} from 'rxjs';

export interface TabLoader<T_TAB extends Tab> {
  tabs: T_TAB[];

  initial(tabName?: string): void;

  load(tabToLoad: T_TAB): void;

  translateTabName(tab: T_TAB): string;
}

export class TabLoaderImpl implements TabLoader<TabImpl> {
  private readonly _tabs: TabImpl[] = null;
  private readonly _componentFactoryResolver: ComponentFactoryResolver = null;
  private readonly _viewContainerRef: ViewContainerRef = null;
  private _activeComponent: ComponentRef<any> = null;
  private _activeTab: TabImpl = null;
  private _translateService: TranslateService = null;
  private _router: Router;
  private _location: Location;
  private _route: ActivatedRoute;

  constructor(
    tabs: TabImpl[],
    componentFactoryResolver: ComponentFactoryResolver,
    viewContainerRef: ViewContainerRef,
    translateService: TranslateService,
    router: Router,
    location: Location,
    route: ActivatedRoute
  ) {
    this._tabs = tabs;
    this._componentFactoryResolver = componentFactoryResolver;
    this._viewContainerRef = viewContainerRef;
    this._translateService = translateService;
    this._router = router;
    this._location = location;
    this._route = route;
  }

  initial(tabName?: string): void {
    let initialTab;
    if (tabName) {
      initialTab = this._tabs.find(tab => tab.name === tabName);
    } else {
      initialTab = this._tabs[0] || null;
    }
    this.load(initialTab);
  }

  load(newTab: TabImpl): void {
    if (newTab !== this._activeTab) {
      this._tabs.forEach(tab => tab.deactivate());
      this.replaceView(newTab);
      this.replaceUrlState(newTab);
      this.setActive(newTab);
    }
  }

  refreshView() {
    this.replaceView(this._activeTab);
  }

  private replaceView(tab: TabImpl): void {
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(tab.component);
    this._viewContainerRef.clear();
    if (this._activeTab !== null) {
      this._activeComponent.destroy();
    }
    this._activeComponent = this._viewContainerRef.createComponent(componentFactory);
  }

  private replaceUrlState(nextTab: TabImpl): void {
    this._route.params.pipe(take(1)).subscribe(params => {
      const currentUrl = this._router.url;
      const currentDocumentId = params?.documentId;
      const queryParams = currentUrl.split('?')[1] || '';
      const urlBeforeDocumentId = currentUrl.split(currentDocumentId)[0];

      this._router.navigateByUrl(
        `${urlBeforeDocumentId}${currentDocumentId}/${nextTab.name}${
          queryParams ? `?${queryParams}` : ''
        }`
      );
    });
  }

  private setActive(tab: TabImpl): void {
    tab.activate();
    this._activeTab = tab;
  }

  get tabs(): TabImpl[] {
    return this._tabs;
  }

  translateTabName(tab: TabImpl): string {
    const translationId = 'dossier.tabs.' + tab.name;
    const translation = this._translateService.instant('dossier.tabs.' + tab.name);
    return translationId !== translation ? translation : tab.name;
  }
}

export interface Tab {
  name: string;
  sequence: number;
  component: any;

  activate(): void;

  deactivate(): void;

  isActive(): boolean;
}

export class TabImpl implements Tab {
  private readonly _name: string;
  private readonly _sequence: number;
  private readonly _component: any;
  private readonly _contentKey: string;
  private _active = false;

  constructor(name: string, sequence: number, component: any, contentKey?: string) {
    this._name = name;
    this._sequence = sequence;
    this._component = component;

    if (contentKey) {
      this._contentKey = contentKey;
    }
  }

  get name(): string {
    return this._name;
  }

  get sequence(): number {
    return this._sequence;
  }

  get component(): any {
    return this._component;
  }

  get contentKey(): string {
    return this._contentKey;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  isActive(): boolean {
    return this._active;
  }
}
