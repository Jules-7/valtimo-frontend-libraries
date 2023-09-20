import {TemplateRef} from '@angular/core';
import {TableRowSize} from 'carbon-components-angular';

export enum ViewType {
  ACTION = 'action',
  ARRAY_COUNT = 'arrayCount',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ENUM = 'enum',
  TEMPLATE = 'template',
  TEXT = 'text',
  UNDERSCORES_TO_SPACES = 'underscoresToSpaces'
}

export interface CarbonTableConfig {
  enableSingleSelect?: boolean;
  searchable?: boolean;
  showSelectionColumn?: boolean;
  size?: TableRowSize;
  sortable?: boolean;
  striped?: boolean;
  withPagination?: boolean;
}

export interface ActionItem {
  actionName: string;
  callback: (_) => void;
  type?: 'normal' | 'danger';
}

export interface ColumnConfig extends ListField{
  viewType: string | ViewType;
  actions?: ActionItem[];
  className?: string;
  format?: string;
  enum?: Array<string> | {[key: string]: string};
  template?: TemplateRef<any>;
}

const defaultTableConfig: CarbonTableConfig = {
  enableSingleSelect: false,
  searchable: false,
  size: 'md',
  showSelectionColumn: false,
  sortable: true,
  striped: false,
  withPagination: false,
};


export interface ListField {
  key: string;
  label: string;
  viewType: string;
  default?: string | boolean;
  sortable?: boolean;
}

export const createCarbonTableConfig = (config?: CarbonTableConfig): CarbonTableConfig => ({
  ...defaultTableConfig,
  ...config,
});
