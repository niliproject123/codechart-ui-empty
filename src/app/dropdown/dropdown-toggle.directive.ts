import { Directive ,Output,HostBinding,HostListener,EventEmitter} from '@angular/core';

@Directive({
  selector: '[DropdownToggleDirective]'
})
export class DropdownToggleDirective {

  @Output() clicked = new EventEmitter();
  @HostBinding('class.dropdown-toggle') true = true;
  @HostListener('click', ['$event']) onclick() {
      this.clicked.emit();
  }

}
