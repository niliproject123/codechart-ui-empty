import { Edge, IdType, Node } from 'vis';
import { AppComponent } from "../app.component";
import { ChartConsts } from './chart.consts';
import { AttributesKey, ChartUtils } from "./chart.utils";
import { ChartWrapper } from './chart.wrapper';
import { Utils } from './Utils';

export class ChartStylingUtils {
  chart: ChartWrapper;

  constructor(private appComponent: AppComponent) { }

  initialize() {
  }


  public static setInContentLinesVisible(app: AppComponent, edges: Edge[]): Edge {
    return edges.map((edge: Edge) => {
      if(!ChartUtils.isInContentEdge(edge)) return edge
      if(!app.Options.showInContentLines) edge.hidden = true
      else edge.hidden = false
      return edge
    })
  }

  public static setCodeLinesVisible(app: AppComponent, nodes: Node[]): Node[] {
    let filterFunc = (node: Node) => ChartUtils.isMatchNode(node) && !ChartUtils.isWasEdited(node)
    let processFunc = (node: Node) => {
      if (app.Options.showCodeLabels) {
        if(!node.label) node.label = ChartUtils.getMatchCodeLineLabel(node)
      } else {
        node.label = ''
      }
      return node
    }

    nodes.forEach((node) => {
      if (!filterFunc(node)) return
      return processFunc(node)
    })

    return nodes
  }

  public static alignChartToGrid(chart: ChartWrapper) {
    let matchCorrections: {node: Node, deltaX, deltaY}[] = []
    // position matches, save save deltas per match
    let allNodes: Node[] = chart.nodes.map((node) => {
      if (ChartUtils.isFilenameNode(node)) return node
      let currentX = node.x
      let roundedX = Utils.round(node.x, ChartConsts.gridBaseSize)
      node.x = roundedX ? roundedX : currentX
      let deltaX = node.x - currentX

      let currentY = node.y
      let roundedY = Utils.round(node.y, ChartConsts.gridBaseSize)
      node.y = roundedY ? roundedY : currentY
      let deltaY = node.y - currentY

      matchCorrections.push({node, deltaX, deltaY})
      return node
    })

    // save map of neighbours of map corrections (filename nodes)
    let neighboursCorrections: Map<IdType, {deltaX, deltaY}> = new Map()
    matchCorrections.forEach((matchCorrection)=>{
      chart.getItems(chart.getNeighbours(matchCorrection.node.id).nodes).nodes.forEach((node)=>{
        if(!ChartUtils.isFilenameNode(node)) return
        neighboursCorrections.set(node.id, {deltaX: matchCorrection.deltaX, deltaY: matchCorrection.deltaY})
      })
    })

    // update neighbours of match positions
    allNodes = allNodes.map((i)=>{
      let correction = neighboursCorrections.get(i.id)
      if(!correction) return i
      i.x += correction.deltaX
      i.y += correction.deltaY
      return i
    })

    chart.nodes.simpleUpdate(allNodes)
  }

}
