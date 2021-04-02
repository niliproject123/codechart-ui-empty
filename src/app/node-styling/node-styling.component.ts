import {Component, Input, OnInit, Output} from '@angular/core';
import {NodeStyles} from '../chart/chart.consts';
import {AppComponent} from '../app.component';

enum StylingTypes {
  edge, node
}

const sizeSteps = {start: 20, step: 2}
const sizes = [5, 20, 40, 70, 100, 400];

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


  public sizes = sizes
  constructor() {
  }

  ngOnInit() {
  }

  groupUngroupFile() {

  }

  changeType(event: Event, type: StylingTypes) {
    event.stopPropagation()
    event.preventDefault()
    this.stylingType = type

  }
}
