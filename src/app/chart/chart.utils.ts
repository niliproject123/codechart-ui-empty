import {Edge, IdType, Node} from 'vis';
import {TypeMapping} from './jsons';
import {FileNode, MatchInfo} from '../types.nodejs';
import { ChartConsts, ContentEdgeTypes } from './chart.consts';
import { ChartWrapper } from './chart.wrapper';

export const AttributesKey = 'd';
export const OldStyleKey = 'oldStyle';

export class ChartUtils {
  static setPosition(matchNode: any, fileNodePos: any) {
    throw new Error('Method not implemented.');
  }
  public static setWasEdited(item: Node | Edge): Node | Edge {
    item[AttributesKey].wasEdited = true
    return item
  }

  public static isWasEdited(item: Node | Edge) {
    return item[AttributesKey].wasEdited
  }

  public static setDragWithParent(newNode: Node): Node {
    newNode['d'].dragWithParent = true
    return newNode
  }

  public static isDragWithParent(node: Node): boolean {
    return node['d'].dragWithParent
  }

  public static getElementSize(element: Node | Edge): number {
    if (ChartUtils.isFileEdge(element)) {
      return (element as Edge).width;
    } else {
      let node = (element as Node);
      if (node.font) {
        return (node.font as any).size;
      }
      return null;
    }
  }

  public static isOfFile(node): boolean {
    return ChartUtils.getMatchAttributes(node).ofFile;
  }

  public static isFileNode(item: Node | Edge): boolean {
    if (!ChartUtils.isNode(item)) return false;
    return (ChartUtils.getMatchAttributes(item as Node) && ChartUtils.getMatchAttributes(item as Node).fileContent);
  }

  public static isSearchNode(item: Node | Edge): boolean {
    if (item.id.toString().startsWith('search_')) return true;
  }

  public static isFileEdge(item: Node | Edge): boolean {
    if (ChartUtils.isNode(item)) return false;
    return item['d'].type === 'ofFile';
  }

  public static isNode(item): boolean {
    return this.getEdgeFrom(item) || this.getEdgeTo(item) ? false : true;
  }

  public static getEdgeFrom(edge: Edge): IdType {
    return edge.from;
  }

  public static getEdgeTo(edge: Edge): IdType {
    return edge.to;
  }

  public static setNewStyleAndGet(element: any, newStyle: any) {
    for (let key in newStyle) {
      element[AttributesKey][OldStyleKey] = {};
      element[AttributesKey][OldStyleKey][key] = element[key];
      element[key] = newStyle[key];
    }
    return element;
  }

  public static filterNodes(nodesAndLinks: Array<Node | Edge>): Node[] {
    return nodesAndLinks.filter(i => {
      if (ChartUtils.isNode(i)) return i;
    }) as Node[];
  }

  public static filterEdges(nodesAndLinks: Array<Node | Edge>): Edge[] {
    return nodesAndLinks.filter(i => {
      if (!ChartUtils.isNode(i)) return i;
    }) as Edge[];
  }

  public static setElementAttributesAndGet(element, newAttributes: any) {
    let newAttributesObject = Object.assign({}, element[AttributesKey], newAttributes);
    return Object.assign({}, element, {d: newAttributesObject});
  }

  public static getFileNodeContent(node) {
    if (node.d !== undefined)
      return ChartUtils.getMatchAttributes(node).fileContent;
    else return null;
  }

  public static setFileContent(node: Node, content, chart: ChartWrapper) {
    chart.updateNodeAtts([node], {fileContent: content});
  }

  public static getOfFileId(node: Node): string {
    return ChartUtils.getMatchAttributes(node).ofFile;
  }

  public static getSameMatch(chart: ChartWrapper, match: MatchInfo, ofFileNodeId: IdType) {
    let sameExisitingMatch = null;
    try {
      let exisitingMatches = chart.getItems(chart.getAllItemIds().nodes).nodes;
      sameExisitingMatch = exisitingMatches.find((i) => {
        return (
          (ChartUtils.getLineNumber(i) === match.lineNumber && ChartUtils.getEndLineNumber(i) == match.endLineNumber && ChartUtils.getOfFileId(i) === ofFileNodeId)
          ||
          match.id === i.id);
      });
    } catch (ex) {
      console.log(ex);
    }
    return sameExisitingMatch ? sameExisitingMatch : null;
  }


  public static setOfFile(node: Node, newOfFile, chart: ChartWrapper) {
    chart.updateNodeAtts([node], {ofFile: newOfFile});
  }

  public static getMatchAttributes(element: Node): MatchInfo | FileNode | any /*so I dont need to cast result. sgould split this to get File and get Match atts*/ {
    return element[AttributesKey];
  }

  public static setAttributes(element: Node, newAttributes: MatchInfo | FileNode) {
    element[AttributesKey] = newAttributes;
  }

  public static getOfFileNode(node: Node, chart: ChartWrapper): Node {
    let elementAtts = chart.getAttributes(node)
    if(!elementAtts) return null
    return chart.getNode(elementAtts.ofFile)
  }

  public static getLineNumber(node: Node) {
    return ChartUtils.getMatchAttributes(node) ? ChartUtils.getMatchAttributes(node).lineNumber : null;
  }

  public static getEndLineNumber(node: Node) {
    return ChartUtils.getMatchAttributes(node) as MatchInfo ? ChartUtils.getMatchAttributes(node).endLineNumber : null;
  }

  public static setLineNumber(node: Node, newLineNumber, chart: ChartWrapper) {
    chart.updateNodeAtts([node], {lineNumber: newLineNumber});
  }

  public static setLine(node: Node, newLine, chart: ChartWrapper) {
    chart.updateNodeAtts([node], {line: newLine});
  }

  public static getIndexInLine(item: Node | Edge) {
    return ChartUtils.getMatchAttributes(item as Node).indexInLine;
  }

  public static getStyleForTypesJson(typesJson: TypeMapping[], node: Node) {
    let nodesStyles: TypeMapping[] = typesJson.filter(type => {
      return type.item === 'node';
    });
    let types = nodesStyles.filter((type: TypeMapping) => {
      let regex = new RegExp(type.regexCondition);
      return regex.exec(ChartUtils.getLine(node)) !== null;
    });
    if (types.length > 0) return types[0].style;
    else return {};
  }

  public static getLine(node) {
    return this.getMatchAttributes(node).line;
  }

  public static getFilePath(fileNode: Node | Edge) {
    return ChartUtils.getMatchAttributes(fileNode as Node).path;
  }

  static isCustomNode(item: Node) {
    return ChartUtils.getMatchAttributes(item).isCustom;
  }

  static isMatchNode(node: Node): boolean {
    if (ChartUtils.getOfFileId(node) && ChartUtils.getLineNumber(node)!==undefined && ChartUtils.getLineNumber(node)!==null) return true;
    else return false;
  }

  static getContentEndLine(j: Node) {
    return (ChartUtils.getMatchAttributes(j) as MatchInfo).endContentLine;
  }

  static isFilenameNode(node: Node) {
    return node['d'] && node['d'].type === 'filename';
  }

  static isInContentEdge(edge: Edge) {
    return edge[AttributesKey].type == ContentEdgeTypes.insideContent
  }

  static setFileNodIsGrouped(node: Node, isGrouped: boolean) {
    node['d'].isGrouped = isGrouped
    return node
  }

  static getFileNodeIsGrouped(node) {
    return node['d'].isGrouped
  }

  public static getMiddlePoint = (nodes: Node[], xOrY: string, chart: ChartWrapper) => {
    return nodes.map(i => chart.getPosition(i.id)[xOrY]).reduce((soFar, current) => {
      return (current + soFar);
    }, 0) / nodes.length;
  };

  public static getFilenameNodeId(matchNode: Node, chart: ChartWrapper): IdType {
    return chart.getNeighbours(matchNode.id).nodes.filter(i=>i.toString().startsWith("filename"))[0]
  }

  static isMatchEdge(i: Edge | Node) {
    if(ChartUtils.isNode(i)) return false
    return i.id.toString().startsWith('match');
  }

  static isFailedRefreshIndicator(i: Node) {
    return i.id.toString().startsWith('failed_');
  }

  static isFailedRefreshIndicatorEdge(i: Edge) {
    return i.id.toString().startsWith('failed_');
  }

  static getMatchCodeLineLabel(node) {
    if(!ChartUtils.getLineNumber || ! ChartUtils.getLine(node)) {
      console.log('error in set match line')
      return ''
    }
    let title = ChartUtils.getLineNumber(node) +
    (ChartUtils.getEndLineNumber(node) ? '-' + ChartUtils.getEndLineNumber(node) : '') +
    ':' +  ChartUtils.getLine(node).trim().substring(0, ChartConsts.maxTitleLength)

    if(ChartUtils.getLine(node).length>ChartConsts.maxTitleLength) title = title + '...'
    return title
  }

  static setIsCustom(node: Node): Node {
    node[AttributesKey]['isCustom'] = true
    return node
  }

  static getIsCustom(node: Node): boolean{
    return node[AttributesKey]['isCustom'];
  }
}
