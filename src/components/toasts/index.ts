import { Component, ViewEncapsulation } from '@angular/core';

import { ToastsManager, ToastContainer } from 'ng2-toastr';

@Component({
  selector: 'toasts',
  encapsulation: ViewEncapsulation.None,
  template: `<toast-container></toast-container>`
})
export class RioToasts {}

