import {Component, Input, OnInit, Output} from '@angular/core';
import {NodeStyles} from '../chart/chart.consts';
import {AppComponent} from '../app.component';

enum StylingTypes {
  edge, node
}

const sizeSteps = {start: 20, step: 2}
const sizes = [5, 20, 40, 70, 100, 400];
const length = [5,10,20,40,80,150,200];
@Component({
  selector: 'node-styling',
  templateUrl: './node-styling.component.html',
  styleUrls: ['./node-styling.component.css']
})
export class NodeStylingComponent implements OnInit {
  @Input() appComponent: AppComponent;
  public sizeSteps = sizeSteps
  public stylingType: StylingTypes = StylingTypes.node
  public StylingTypes = StylingTypes
  SelectedEdgeSize = 100;
  SelectedEdgeFontSize = 5;

  SelectedNodeSize = 100;
  SelectedNodeFontSize = 5;
  
  SelectedLength = 10;
  public dropdownSizeSelection: { label; value }[] = []
  public dropdownlengthSelection: { label; value }[] = []

  public sizes = sizes
  public length = length
  public icons = ["./../assets/icons/svg/CodeChart_Web_Icons__Load from Cloud.svg"]
  constructor() {
  }

  ngOnInit() {
    this.dropdownSizeSelection = this.sizes.map(i => { return { value: i, label: i } })
    this.dropdownlengthSelection = this.length.map(i => { return { value: i, label: i } })

  }

  groupUngroupFile() {

  }

  checkbackgroundcolor(size,comparesize){
    
              if(size == comparesize){
                return '#2d2d2d';
              }else{
                return '#c3c3c3';
              }
    
    
  }
  
  checkcolor(size,comparesize){
    
    if(size == comparesize){
      return '#909090';
    }else{
      return '#474747';
    }


}
  changeType(event: Event, type: StylingTypes) {
    event.stopPropagation()
    event.preventDefault()
    this.stylingType = type

  }
}
