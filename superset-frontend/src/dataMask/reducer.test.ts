/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { DataMaskStateWithId, Filter, NativeFilterType } from '@superset-ui/core';
import { HYDRATE_DASHBOARD } from 'src/dashboard/actions/hydrate';
import { NATIVE_FILTER_PREFIX } from 'src/dashboard/components/nativeFilters/FiltersConfigModal/utils';
import dataMaskReducer from './reducer';
import { AnyDataMaskAction, UPDATE_DATA_MASK } from './actions';

const buildNativeFilter = (id: string, name: string): Filter => ({
  cascadeParentIds: [],
  id,
  name,
  filterType: 'filter_select',
  targets: [
    {
      datasetId: 0,
      column: {
        name: 'test column',
        displayName: 'test column',
      },
    },
  ],
  defaultDataMask: {
    filterState: {
      value: null,
    },
  },
  scope: {
    rootPath: [],
    excluded: [],
  },
  controlValues: {
    allowsMultipleValues: true,
    isRequired: false,
  },
  type: NativeFilterType.NativeFilter,
  description: '',
});

test('hydrates native filter data mask with name when state exists', () => {
  const filter = buildNativeFilter(`${NATIVE_FILTER_PREFIX}1`, 'Created filter');
  const initialDataMask: DataMaskStateWithId = {
    [filter.id]: {
      filterState: { value: ['foo'], label: 'foo' },
      extraFormData: { filters: [{ col: 'name', op: '==', val: 'foo' }] },
    },
  };

  const result = dataMaskReducer(
    {},
    {
      type: HYDRATE_DASHBOARD,
      data: {
        dashboardInfo: {
          metadata: {
            native_filter_configuration: [filter],
            chart_configuration: {},
          },
        },
        dataMask: initialDataMask,
      },
    } as unknown as AnyDataMaskAction,
  );

  expect(result[filter.id]).toEqual(
    expect.objectContaining({
      name: filter.name,
      filterState: { value: ['foo'], label: 'foo' },
      extraFormData: { filters: [{ col: 'name', op: '==', val: 'foo' }] },
    }),
  );
});

test('does not attach name when filter state and form data are empty', () => {
  const filter = buildNativeFilter(`${NATIVE_FILTER_PREFIX}2`, 'Empty filter');
  const result = dataMaskReducer(
    {},
    {
      type: HYDRATE_DASHBOARD,
      data: {
        dashboardInfo: {
          metadata: {
            native_filter_configuration: [filter],
            chart_configuration: {},
          },
        },
        dataMask: {
          [filter.id]: {
            filterState: {},
            extraFormData: {},
          },
        },
      },
    } as unknown as AnyDataMaskAction,
  );

  expect(result[filter.id]?.name).toBeUndefined();
});

test('does not attach name when value is empty array', () => {
  const filter = buildNativeFilter(`${NATIVE_FILTER_PREFIX}3`, 'Empty array');
  const result = dataMaskReducer(
    {},
    {
      type: HYDRATE_DASHBOARD,
      data: {
        dashboardInfo: {
          metadata: {
            native_filter_configuration: [filter],
            chart_configuration: {},
          },
        },
        dataMask: {
          [filter.id]: {
            filterState: { value: [] },
            extraFormData: {},
          },
        },
      },
    } as unknown as AnyDataMaskAction,
  );

  expect(result[filter.id]?.name).toBeUndefined();
});

test('clears name on update when value becomes empty', () => {
  const filterId = `${NATIVE_FILTER_PREFIX}4`;
  const filter = buildNativeFilter(filterId, 'Transient name');
  const hydrated = dataMaskReducer(
    {},
    {
      type: HYDRATE_DASHBOARD,
      data: {
        dashboardInfo: {
          metadata: {
            native_filter_configuration: [filter],
            chart_configuration: {},
          },
        },
        dataMask: {
          [filterId]: {
            filterState: { value: ['val'] },
            extraFormData: {},
          },
        },
      },
    } as unknown as AnyDataMaskAction,
  );

  expect(hydrated[filterId]?.name).toEqual(filter.name);

  const updated = dataMaskReducer(hydrated, {
    type: UPDATE_DATA_MASK,
    filterId,
    dataMask: {
      filterState: { value: null, excludeFilterValues: true },
    },
  });

  expect(updated[filterId]?.name).toBeUndefined();
});
