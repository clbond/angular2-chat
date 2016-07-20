import { Injectable } from '@angular/core';
import { NgRedux } from 'ng2-redux';
import { ToastsManager } from 'ng2-toastr';
import { IAppState } from '../reducers';
import { ServerService } from '../services/server';

import {
  Contact,
  ConcreteContact,
  Presence,
} from '../contacts';

import { RealTime } from '../services/server/real-time';

export interface SelectEvent {
  // The contact being selected or unselected
  contact: ConcreteContact;

  // The index of the contact inside the available contacts list
  index: number;
};

@Injectable()
export class ContactsActions {
  static SELECT_CONTACT = 'SELECT_CONTACT';
  static UNSELECT_CONTACT = 'UNSELECT_CONTACT';
  static ADD_CONTACT = 'ADD_CONTACT';
  static ADD_CONTACT_CANCEL = 'ADD_CONTACT_CANCEL';
  static ADD_CONTACT_COMPLETE = 'ADD_CONTACT_COMPLETE';
  static ADD_CONTACT_PENDING = 'ADD_CONTACT_PENDING';
  static ADD_CONTACT_ERROR = 'ADD_CONTACT_ERROR';
  static DELETE_CONTACT = 'DELETE_CONTACT';
  static CHANGE_PRESENCE = 'CHANGE_PRESENCE';
  static REQUEST_AVAILABLE_CONTACTS = 'REQUEST_AVAILABLE_CONTACTS';
  static LIST_AVAILABLE_CONTACTS = 'LIST_AVAILABLE_CONTACTS';
  static LIST_AVAILABLE_CONTACTS_FAILED = 'LIST_AVAILABLE_CONTACTS_FAILED';
  static PRESENCE_PUBLISHED = 'PRESENCE_PUBLISHED';

  constructor(
      private ngRedux: NgRedux<IAppState>,
      private service: ServerService,
      private realtime: RealTime,
      private toasts: ToastsManager
  ) {
    this.realtime.subscribePresence(this.presencePublished.bind(this));
  }

  show() {
    this.ngRedux.dispatch({ type: ContactsActions.ADD_CONTACT });

    this.list();
  }

  cancel() {
    this.ngRedux.dispatch({ type: ContactsActions.ADD_CONTACT_CANCEL });
  }

  select(event: SelectEvent) {
    this.ngRedux.dispatch({
      type: ContactsActions.SELECT_CONTACT,
      payload: event
    });
  }

  unselect(event: SelectEvent) {
    this.ngRedux.dispatch({
      type: ContactsActions.UNSELECT_CONTACT,
      payload: event
    });
  }

  add() {
    const state = this.ngRedux.getState();

    const existing = state.contacts.get('people').toJS();

    const selected = state.contacts.get('availablePeople')
      .filter(
        p => p.get('selected') &&
        existing.find(c => c.username === p.username) == null);

    if (selected.count() === 0) {
      return;
    }

    this.ngRedux.dispatch({
      type: ContactsActions.ADD_CONTACT_PENDING,
      payload: selected,
    });

    const body = selected.toJS();

    const promise = this.service.postSingle<void>('/contacts/add', body);

    return promise.then(
      () => this.ngRedux.dispatch({
        type: ContactsActions.ADD_CONTACT_COMPLETE,
      }),
      error => {
        const message = `${error.status} ${error._body}`;

        this.ngRedux.dispatch({
          type: ContactsActions.ADD_CONTACT_ERROR,
          payload: message
        });

        this.toasts.error(`Failed to add contact: ${message}`);
      });
  }

  list() {
    this.ngRedux.dispatch({ type: ContactsActions.REQUEST_AVAILABLE_CONTACTS });

    const promise = this.service.getSingle<ConcreteContact[]>('/contacts/list');

    const transform = (c: ConcreteContact) => {
      return Object.assign({}, c, { presence: Presence[c.presence] });
    };

    return promise.then(
      contacts => this.ngRedux.dispatch({
        type: ContactsActions.LIST_AVAILABLE_CONTACTS,
        payload: contacts.map(c => transform(c)),
      }),
      error => {
        this.ngRedux.dispatch({
          type: ContactsActions.LIST_AVAILABLE_CONTACTS_FAILED,
        });

        this.toasts.error(
          `Failed to list contacts: ${error.status} ${error._body}`);
      });
  }

  removeContact(contact: ConcreteContact) {
    const promise = this.service
      .deleteSingle('/contacts/delete', contact.username);

    promise
      .then(() => this.ngRedux.dispatch({
        type: ContactsActions.DELETE_CONTACT,
        payload: contact.username
      }))
      .catch(error => {
        this.toasts.error(
          `Failed to delete contact: ${error.status} ${error._body}`);
      });
  }

  changePresence(state: Presence) {
    const promise = this.service
      .getSingle<void>(`/contacts/change-presence/${Presence[state]}`);

    promise.then(() => {
      this.ngRedux.dispatch({
        type: ContactsActions.CHANGE_PRESENCE,
        payload: state,
      });

      this.realtime.publishPresence(state);
    })
    .catch(error => {
        this.toasts.error(
          `Failed to change presence: ${error.status} ${error._body}`);
    });
  }

  presencePublished(from: ConcreteContact, state: Presence) {
    this.ngRedux.dispatch({
      type: ContactsActions.PRESENCE_PUBLISHED,
      payload: {from, state}
    });
  }
}
