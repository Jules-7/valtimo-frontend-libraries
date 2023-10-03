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

import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {ProcessDefinition, ProcessService} from '@valtimo/process';
import {Router} from '@angular/router';
import {CarbonTableConfig, ColumnConfig, createCarbonTableConfig, ViewType} from '@valtimo/components';
import {IconService} from 'carbon-components-angular';
import {Upload16} from '@carbon/icons';

@Component({
    selector: 'valtimo-process-management-list',
    templateUrl: './process-management-list.component.html',
    styleUrls: ['./process-management-list.component.scss'],
})
export class ProcessManagementListComponent implements OnInit, AfterViewInit {
    @ViewChild('readOnlyTag', {static: false}) readOnlyTag: TemplateRef<any>;

    public processDefinitions: ProcessDefinition[] = [];
    public fields: ColumnConfig[]

    public readonly tableConfig: CarbonTableConfig = createCarbonTableConfig({sortable: false});


    constructor(
        private processService: ProcessService,
        private router: Router,
        private readonly iconService: IconService
    ) {
    }

    ngOnInit() {
        this.loadProcessDefinitions();
        this.iconService.registerAll([Upload16])
    }

    loadProcessDefinitions() {
        this.processService.getProcessDefinitions().subscribe((processDefs: ProcessDefinition[]) => {
            this.processDefinitions = processDefs;
        });
    }

    editProcessDefinition(processDefinition: ProcessDefinition) {
        this.router.navigate(['/processes/process', processDefinition.key]);
    }

    ngAfterViewInit(): void {
        this.fields = [
            {key: 'name', label: 'Name', viewType: ViewType.TEXT},
            {key: 'key', label: 'Key', viewType: ViewType.TEXT},
            {key: 'readOnly', label: 'Read-only', viewType: ViewType.TEMPLATE, template: this.readOnlyTag},
        ];
    }
}
