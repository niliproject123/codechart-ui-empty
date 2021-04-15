import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  HostListener,
  OnChanges,
  SimpleChanges,
  ViewChildren,
  ElementRef,
  QueryList,
  AfterViewInit,
  ChangeDetectorRef,
  forwardRef,ViewChild
} from "@angular/core";



import { NG_VALUE_ACCESSOR } from "@angular/forms";
export interface Dropdownitem{
  name:string,
  icon:string,
  toggled:boolean
}

export const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DropdownComponent),
  multi: true
};

@Component({
  selector: 'app-dropdown',
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements  OnInit,AfterViewInit,OnChanges{
  @Input() public options: Dropdownitem[];
  @Input() public icon:string;
  @Output() ItemClickEvent = new EventEmitter<{value,index}>();

 

  
 ngOnInit(){
 
 }
 ngAfterViewInit(){
 
 }
 ngOnChanges(){
 
 }
 ClickItem(value: string,index:number) {
  
  this.ItemClickEvent.emit({value,index});
}
 closedropdown(){
   alert("drop down close event occurs")
 }
 

}