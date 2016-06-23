import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { select, NgRedux } from 'ng2-redux';
import { Map } from 'immutable';
import { Observable } from 'rxjs/Observable';

import { IAppState } from '../../reducers';
import { RioButton } from '../button';
import {
  RioModal,
  RioModalContent,
} from '../modal/index';

import { RioAddContactForm } from './add-contact-form';
import { RioUserPresence } from './user-presence';
import { RioPresenceIndicator } from './presence-indicator';
import { RioRemoveContactConfirm } from './remove-contact-confirm';

import {
  Contact,
  ConcreteContact,
  Presence
} from '../../contacts';

import { Contacts } from '../../reducers/contacts';

@Component({
  selector: 'rio-contacts',
  template: `
    <div>
      <rio-user-presence
        [state]="state"
        (stateChange)="onStateChanged($event)">
      </rio-user-presence>
      <ul>
        <li *ngFor="let contact of (people$ | async)" class="status">
          <rio-presence-indicator [presence]="contact.presence">
          </rio-presence-indicator>
          <span class="username">{{contact.username}}</span>
          <ul class="actions">
            <li>
              <button (click)="onChat(contact)">Chat</button>
            </li>
            <li>
              <button (click)="onRemove(contact)">Remove</button>
            </li>
          </ul>
        </li>
      </ul>

      <rio-button (onClick)="onAddContact()">
        Add Contact
      </rio-button>

      <rio-modal *ngIf="addingContact$ | async">
        <rio-modal-content>
          <rio-add-contact-form
            [state]="addState$ | async"
            [availablePeople]="availablePeople$ | async"
            (select)="onSelect($event)"
            (unselect)="onUnselect($event)"
            (cancel)="onCancel()"
            (add)="onAdd($event)">
          </rio-add-contact-form>
        </rio-modal-content>
      </rio-modal>

      <rio-modal *ngIf="removingContact">
        <rio-modal-content>
          <rio-remove-contact-confirm
            [contact]="removingContact"
            (cancel)="onCancelConfirm()"
            (confirm)="onRemoveConfirm(removingContact)">
          </rio-remove-contact-confirm>
        </rio-modal-content>
      </rio-modal>
    </div>
  `,
  directives: [
    RioButton,
    RioModal,
    RioModalContent,
    RioAddContactForm,
    RioUserPresence,
    RioPresenceIndicator,
    RioRemoveContactConfirm,
  ],
  pipes: [AsyncPipe],
  styles: [require('./index.css')],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RioContacts {
  @select() contacts$: Observable<Contacts>;

  @Output() add = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() request = new EventEmitter<Contact>();
  @Output() select = new EventEmitter<Contact>();
  @Output() unselect = new EventEmitter<Contact>();
  @Output() changePresence = new EventEmitter<Presence>();
  @Output() openChat = new EventEmitter<Contact>();
  @Output() removeContact = new EventEmitter<Contact>();

  private presence = Presence;

  private people$: Observable<Contact>;
  private addingContact$: Observable<boolean>;
  private addFailure$: Observable<string>;
  private addState$: Observable<boolean>;
  private availablePeople$: Observable<ConcreteContact>;
  private existingContacts$: Observable<ConcreteContact>;
  private removingContact: Contact;

  constructor() {
    this.people$ = this.contacts$.map(c => c.get('people').toJS());

    this.availablePeople$ =
      this.contacts$.map(c => c.get('availablePeople').toJS());

    const add = this.contacts$.map(c => c.get('add'));

    this.addingContact$ = add.map(c => c.get('modal'));

    this.addState$ = add.map(c => c.get('state'));
  }

  private onAddContact = () => {
    this.add.emit(void 0);
  }

  private onAdd = (contact: Contact) => {
    this.request.emit(contact);
  }

  private onCancel = () => {
    this.cancel.emit(void 0);
  }

  private onSelect = (contact: Contact) => {
    this.select.emit(contact);
  }

  private onUnselect = (contact: Contact) => {
    this.unselect.emit(contact);
  }

  private onStateChanged = (state: Presence) => {
    this.changePresence.emit(state);
  }

  private onChat = (contact: Contact) => {
    this.openChat.emit(contact);
  }

  private onRemove = (contact: Contact) => {
    this.removingContact = contact;
  }

  private onRemoveConfirm = (contact: Contact) => {
    this.removeContact.emit(contact);
    this.removingContact = null;
  }

  private onCancelConfirm = () => {
    this.removingContact = null;
  }
};
