import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeStylingComponent } from './node-styling.component';

describe('NodeStylingComponent', () => {
  let component: NodeStylingComponent;
  let fixture: ComponentFixture<NodeStylingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeStylingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeStylingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
