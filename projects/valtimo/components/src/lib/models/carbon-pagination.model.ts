interface CarbonPaginatorConfig {
  itemsPerPageOptions?: number[];
  showPageInput?: boolean;
}

interface CarbonPaginationSelection {
  page: number;
  size: number;
}

const DEFAULT_PAGINATOR_CONFIG: CarbonPaginatorConfig = {
  itemsPerPageOptions: [10, 20, 30, 40, 50],
  showPageInput: true,
};

export {CarbonPaginatorConfig, CarbonPaginationSelection, DEFAULT_PAGINATOR_CONFIG};

// const defaultPaginationConfig: CarbonPaginationConfig = {
//   page: 1,
//   size: 10,
//   collectionSize: 0,
//   itemsPerPageOptions: [10, 20, 30, 40, 50],
//   showPageInput: true,
// };

// export const createPaginationConfig = (
//   config?: CarbonPaginationConfig
// ): CarbonPaginationConfig => ({
//   ...defaultPaginationConfig,
//   ...config,
// });
