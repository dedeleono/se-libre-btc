/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {SettingName} from '@/types/editor-settings';
import type {JSX} from 'react';

import * as React from 'react';
import {createContext, ReactNode, useContext} from 'react';

import {INITIAL_SETTINGS} from '@/types/editor-settings';

// The editor's feature settings are fixed configuration: nothing in the app changes them
// at runtime (the playground's settings panel was removed).
type SettingsContextShape = {
  settings: Record<SettingName, boolean>;
};

const contextValue: SettingsContextShape = {settings: INITIAL_SETTINGS};

const Context: React.Context<SettingsContextShape> = createContext(contextValue);

export const SettingsContext = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useSettings = (): SettingsContextShape => {
  return useContext(Context);
};
