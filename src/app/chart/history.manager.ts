import {Node, Edge} from "vis";
import {ChartWrapper} from "./chart.wrapper";

export class HistoryItem {
  items: {nodes: Node[], edges: Edge[]} = {nodes: [], edges: []}
  isSearch = false
  constructor(chart: ChartWrapper) {
    let historyNodes = chart.nodes.get().map(node=>{return Object.assign({}, node, chart.getPositions(node.id))})
    let historyEdges = chart.edges.get().map(edge=>{return Object.assign({}, edge, chart.getPositions(edge.id))})

    this.items.nodes = historyNodes
    this.items.edges = historyEdges
  }
}

export class HistoryManager {
  history: HistoryItem[] = []
  public push(newItem: HistoryItem, isSearch) {
    if(isSearch) newItem.isSearch = true
    this.history.push(newItem)
  }

  public pop(): HistoryItem {
    return this.history.pop()
  }

  public getSearchCount() {
    return this.history.filter(i=>i.isSearch).length
  }
}
