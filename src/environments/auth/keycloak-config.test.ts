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

import {Auth, AuthProviders, ValtimoKeycloakOptions} from '@valtimo/contract';
import {KeycloakAuthGuardService, keycloakInitializer, KeycloakModule, KeycloakUserService} from '@valtimo/keycloak';
import {KeycloakConfig, KeycloakOnLoad} from 'keycloak-js';

export const keycloakAuthenticationProviders: AuthProviders = {
  guardServiceProvider: KeycloakAuthGuardService,
  userServiceProvider: KeycloakUserService
};

export const keycloakConfigDev: KeycloakConfig = {
  url: '',
  realm: '',
  clientId: ''
};

export const keycloakOnLoad: KeycloakOnLoad = 'login-required';

export const keycloakInitOptions: any = {
  config: keycloakConfigDev,
  onLoad: keycloakOnLoad,
  checkLoginIframe: false,
  flow: 'standard',
  redirectUri: ''
};

export const valtimoKeycloakOptions: ValtimoKeycloakOptions = {
  keycloakOptions: {
    config: keycloakConfigDev,
    initOptions: keycloakInitOptions,
    enableBearerInterceptor: true,
    bearerExcludedUrls: [
      '/assets',
      '.*?\.amazonaws.com/'
    ]
  },
  logoutRedirectUri: ''
};

export const authenticationKeycloak: Auth = {
  module: KeycloakModule,
  initializer: keycloakInitializer,
  authProviders: keycloakAuthenticationProviders,
  options: valtimoKeycloakOptions
};
