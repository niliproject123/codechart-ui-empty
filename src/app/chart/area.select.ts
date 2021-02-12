import * as $ from 'jquery';
import { AppComponent } from "../app.component";

export class AreaSelect {
  public container = $("#network");
  public data = {
    nodes: null,
    edges: null
  };
  public network;

  public canvas;
  public ctx;
  public rect: any = {};
  public drag = false;
  public drawingSurfaceImageData;
  constructor(private app: AppComponent) {
  }

  public saveDrawingSurface() {
    this.drawingSurfaceImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  public restoreDrawingSurface() {
    this.ctx.putImageData(this.drawingSurfaceImageData, 0, 0);
  }

  public selectNodesFromHighlight() {
    let fromX, toX, fromY, toY;
    let nodesIdInDrawing = [];
    let xRange = this.getStartToEnd(this.rect.startX, this.rect.w);
    let yRange = this.getStartToEnd(this.rect.startY, this.rect.h);

    let allNodes = this.app.chart.nodes.get();
    for (let i = 0; i < allNodes.length; i++) {
      let curNode = allNodes[i];
      if(curNode.hidden) continue
      let nodePosition = this.network.getPositions([curNode.id]);
      let nodeXY = this.network.canvasToDOM({ x: nodePosition[curNode.id].x, y: nodePosition[curNode.id].y });
      if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) {
        nodesIdInDrawing.push(curNode.id);
      }
    }
    this.network.selectNodes(nodesIdInDrawing);
  }

  public getStartToEnd(start, theLen) {
    return theLen > 0 ? { start: start, end: start + theLen } : { start: start + theLen, end: start };
  }

  public intialize() {
    this.network = this.app.chart.chart
    this.container = $("#vis_element")
    this.container.on("mousemove", (e) => {
      if (this.drag) {
        this.restoreDrawingSurface();
        this.rect.w = (e.pageX - e.currentTarget.offsetLeft) - this.rect.startX;
        this.rect.h = (e.pageY - e.currentTarget.offsetTop) - this.rect.startY;

        this.selectNodesFromHighlight();

        // this.ctx.setLineDash([5]);
        // this.ctx.strokeStyle = "rgb(0, 102, 0)";
        // this.ctx.strokeRect(this.rect.startX, this.rect.startY, this.rect.w, this.rect.h);
        // this.ctx.setLineDash([]);
        // this.ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        // this.ctx.fillRect(this.rect.startX, this.rect.startY, this.rect.w, this.rect.h);
        return true

      }
    });

    this.container.on("mousedown", (e) => {
      if (e.button == 2) {
        let selectedNodes = e.ctrlKey ? this.network.getSelectedNodes() : null;
        this.saveDrawingSurface();
        let that = this;
        this.rect.startX = e.pageX - e.currentTarget.offsetLeft;
        this.rect.startY = e.pageY - e.currentTarget.offsetTop;
        this.drag = true;
        this.container[0].style.cursor = "crosshair";
      }
    });

    this.container.on("mouseup", (e) => {
      if (e.button == 2) {
        this.restoreDrawingSurface();
        this.drag = false;

        this.container[0].style.cursor = "default";
      }
    });

    document.getElementById('vis_element').oncontextmenu = function () { return false; };

    this.canvas = this.app.chart.getCanvas();
    this.ctx = this.canvas.getContext('2d');

  }
}
