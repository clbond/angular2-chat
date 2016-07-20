import { Component, ViewEncapsulation, ApplicationRef } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES } from '@angular/router-deprecated';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';
import { Map } from 'immutable';
import { NgRedux, select } from 'ng2-redux';

import { IAppState } from '../reducers';
import { Session } from '../reducers/session';
import { SessionActions } from '../actions/session';
import { RioContactsPage } from './contacts-page';
import { rootReducer } from '../reducers';
import { middleware, enhancers } from '../store';
import { RealTime } from '../services/server/';

import {
  RioButton,
  RioNavigator,
  RioNavigatorItem,
  RioLogo,
  RioLoginModal,
  RioToasts,
} from '../components';

@Component({
  selector: 'rio-sample-app',
  directives: [
    ROUTER_DIRECTIVES,
    RioNavigator,
    RioNavigatorItem,
    RioLoginModal,
    RioLogo,
    RioButton,
    RioToasts,
  ],
  pipes: [ AsyncPipe ],
  encapsulation: ViewEncapsulation.None,
  styles: [require('../styles/index.css')],
  template: require('./sample-app.tmpl.html')
})
@RouteConfig([
  {
    path: '/contacts',
    name: 'Contacts',
    component: RioContactsPage,
    useAsDefault: true
  }
])
export class RioSampleApp {
  @select() session$: Observable<Session>;

  private failure$: Observable<boolean>;
  private pending$: Observable<boolean>;
  private loggedIn$: Observable<boolean>;
  private loggedOut$: Observable<boolean>;
  private userName$: Observable<string>;

  constructor(
    private ngRedux: NgRedux<IAppState>,
    private actions: SessionActions,
    private realTime: RealTime  // angular is lazy, force a connection
  ) {

    ngRedux.configureStore(rootReducer, {}, middleware, enhancers);

    this.failure$   = this.session$.map(s => !!s.get('failure'));
    this.pending$   = this.session$.map(s => !!s.get('pending'));
    this.loggedIn$  = this.session$.map(s => !!s.get('token'));
    this.loggedOut$ = this.loggedIn$.map(loggedIn => !loggedIn);
    this.userName$  = this.session$.map(s => s.getIn(['user', 'username'], ''));
  }
};
