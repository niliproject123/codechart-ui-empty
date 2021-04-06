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
  @Input() public options: any = [];
  @Input() public icon:string;
 

  
 ngOnInit(){
 
 }
 ngAfterViewInit(){
 
 }
 ngOnChanges(){
 
 }
 closedropdown(){
   alert("drop down close event occurs")
 }
 

}