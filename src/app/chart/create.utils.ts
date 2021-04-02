import {Color, Edge, Node} from 'vis';
import {ChartConsts, ChartStyles} from './chart.consts';
import {ChartWrapper} from './chart.wrapper';

import * as md5 from 'md5';
import {FileNode, FindInFilesResponse, MatchInfo} from '../types.nodejs';
import {ChartUtils} from './chart.utils';
import {Utils} from './Utils';
import {PositioningOptions} from './chart.actions';
import {Options} from '../app.component';


export class CreateUtils {

  public static createOrUpdateMatchNode(match: MatchInfo, ofFileNodeId, chart: ChartWrapper, connectToNode: Node, additionalStyle?): Array<Node | Edge> {
    const searchIndex = chart.history.getSearchCount();
    let results: Array<Node | Edge> = [];
    let matchNode: Node = ChartUtils.getSameMatch(chart, match, ofFileNodeId);
    if (matchNode === null) {
      matchNode = this.createMatchNode(match, ofFileNodeId, chart, additionalStyle)
    } else {
      let matchAttributes = ChartUtils.getMatchAttributes(matchNode);
      if (matchAttributes.ofFile !== ofFileNodeId) {
        matchNode.x = null;
        matchNode.y = null;
        let fileEdge = chart.getItems(chart.getAllItemIds().edges).edges.find((i) => {
          return ((i.from === match.id && i.to === matchAttributes.ofFile) || (i.from === matchAttributes.ofFile && i.to === match.id));
        });
        if (fileEdge)
          chart.deleteItems({edges: [fileEdge.id], nodes: []});
        else
          console.log(`no file edge found from match ${match.id} and file node ${matchAttributes.ofFile}`);
      }
      ChartUtils.setAttributes(matchNode, match);
    }
    if (connectToNode !== null && connectToNode.id !== matchNode.id && !ChartUtils.isFileNode(connectToNode)) {
      results.push(CreateUtils.createMatchEdge(chart, connectToNode.id, matchNode.id, matchNode.label));
    }
    results.push(matchNode);
    let fileEdge = CreateUtils.createFileEdge(chart, ofFileNodeId, match.id);
    results.push(fileEdge);
    if (searchIndex) {
      // let numberingNode = chart.createNode('numbering_'+matchNode.id+'_'+searchIndex, searchIndex.toString(), ChartStyles.numberNode)
      // let numberingEdge = chart.createLink(matchNode.id, numberingNode.id, ChartStyles.numberLink)
      // results = results.concat([numberingNode, numberingEdge])
    }
    return results;
  }


  public static createMatchNode(match: MatchInfo, ofFileNodeId, chart: ChartWrapper, additionalStyle?) {

    let matchNodeId = match.id;
    let matchNodeProps = Object.assign({
      d: Object.assign(match, {ofFile: ofFileNodeId})
    }, ChartStyles.resultNode);
    let matchNode
    matchNode =  chart.createNode(matchNodeId, '', matchNodeProps);

    matchNode = Utils.deepMerge(matchNode, ChartStyles.searchNode);
    if (additionalStyle) matchNode = Utils.deepMerge(matchNode, additionalStyle);

    return matchNode;
  }

  public static createFileNameNode(fileName, node: Node, color: Color, chart: ChartWrapper): Array<Edge | Node> {
    let filenameNode = chart.createNode('filename_' + node.id, '', {d: {type: 'filename'}});
    filenameNode.label = fileName;
    filenameNode.x = node.x - 50;
    filenameNode.y = node.y - 50;
    filenameNode = Utils.deepMerge(filenameNode, ChartStyles.filenameNode);
    filenameNode.color.background = color.border
    filenameNode = ChartUtils.setDragWithParent(filenameNode)
    delete filenameNode['widthConstraint'];
    let filenameEdge = chart.createLink(node.id, filenameNode.id, null, {idPrefix: 'filenameEdge'});
    filenameEdge.physics = false
    filenameEdge.smooth = false
    return [filenameEdge, filenameNode];

  }

  // if match exists, in same file - update line, line number
  // if match exists, different file - update line, line number, move to new file
  public static createId(filePath, lineNumber): string {
    return md5(filePath + lineNumber + new Date().getMilliseconds());
  }

  public static createShapeId(shapeType, id): string {
    return shapeType + id + new Date().getMilliseconds();
  }

  public static createFileEdge(chart: ChartWrapper, ofFileNodeId, matchNodeId) {
    return chart.createLink(ofFileNodeId, matchNodeId, ChartStyles.fileLink, {idPrefix: 'fileEdge'});
  }

  public static createMatchEdge(chart: ChartWrapper, nodeToConnectId, matchNodId, matchValue) {
    return chart.createLink(nodeToConnectId, matchNodId, ChartStyles.matchMatchLink, {idPrefix: `match`});
  }

  public static createFileNode(file: FindInFilesResponse, chart: ChartWrapper, existingFileColors: string[], xPos): FileNode {
    let pathChar = file.file.indexOf('\\') != -1 ? '\\' : '/';
    let fileName = file.file.substring(file.file.lastIndexOf(pathChar), file.file.length);
    let fileNode = chart.createNode(file.file, fileName, ChartStyles.fileNode);
    fileNode.x = xPos
    fileNode.color.border = Utils.getRandomColor_useList(existingFileColors).border;
    return ChartUtils.setElementAttributesAndGet(Utils.deepCopy(fileNode), {fileContent: file.content, path: file.file, level: 0});
  }

  public static createFailedRefreshNode(node: Node, chart, oldLineText): {node: Node, edge: Edge} {
    // let failedNode = chart.createNode(, oldLineText)
    let failedNode = this.createMatchNode({id: null, line: oldLineText, ofFile: ChartUtils.getOfFileId(node), lineNumber: -1}, ChartUtils.getOfFileId(node), chart, ChartStyles.failedRefreshNode)
    failedNode.id = "failed_"+node.id
    failedNode = Object.assign(failedNode, ChartStyles.failedRefreshNode)
    if(oldLineText!==null && oldLineText!==undefined) {
      Utils.deepMerge(failedNode, {d: {oldLineText: oldLineText}})
    }
    failedNode.x = (node.size ? (node.size) : 0 ) + node.x + 100;
    failedNode.y = (node.size ? (node.size) : 0 ) + node.y + 100;
    let edge = chart.createLink(node.id, failedNode.id, {}, {idPrefix: 'failed'})
    edge.arrows = null
    return{node: failedNode, edge: edge}
  }
}
