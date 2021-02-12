import {AppComponent, Options} from '../app.component';
import {ChartConsts, ChartStyles, ContentEdgeTypes, ContentEdgeTypes_type, MatchDistance} from './chart.consts';
import {Edge, IdType, Node} from 'vis';
import {ChartWrapper} from './chart.wrapper';
import {ChartUtils} from './chart.utils';
import {FileNode, MatchInfo, ReloadFilesResponse} from '../types.nodejs';
import {CreateUtils} from './create.utils';
import {Utils} from './Utils';
import * as diff from 'diff-lines';

export interface ReloadOptions {addFailedReloadToDiagram?: boolean, markNullFiles?: boolean}
export interface ContentOfMatch {
  content: string,
  startIndex: number,
  endIndex: number
}

export interface AddedFileMatches {
  fileNode: Node,
  matches: Node[],
  links: Edge[]
}

export enum PositioningOptions {DOWN, RIGHT, LEFT, UP}

export class ChartActions {
  private app: AppComponent;
  private chart: ChartWrapper;
  private diff: any;

  constructor(appComponent: AppComponent) {
    this.app = appComponent;
    this.diff = diff;
  }

  initialize() {
    this.chart = this.app.chart;
  }

  getMatchNodesPositions(matchNodes: Node[], alignToPos: { x, y }): { x, y }[] {
    if (matchNodes.length === 0) return [alignToPos];
    let varyingStepSize = MatchDistance.betweenMatches();
    let fixedStepSize = MatchDistance.toPreviousMatch();
    // if(this.app.Options.positioning === PositioningOptions.DOWN || this.app.Options.positioning === PositioningOptions.UP) {
    //   fixedStepSize = fixedStepSize / 3
    // }

    let range = varyingStepSize * (matchNodes.length - 1);
    let firstInRangePos;
    if (this.app.Options.positioning === PositioningOptions.LEFT || this.app.Options.positioning === PositioningOptions.RIGHT) {
      firstInRangePos = alignToPos.y - range / 2;
    } else {
      firstInRangePos = alignToPos.x - range / 2;
    }

    let positions: { x, y }[] = matchNodes.map((i, index) => {
      if (i.x || i.y) return {x: i.x, y: i.y};
      if (this.chart.getNode(i.id)) return this.chart.getPosition(i.id);

      if (this.app.Options.positioning === PositioningOptions.RIGHT) {
        return {
          y: firstInRangePos + index * varyingStepSize,
          x: alignToPos.x + fixedStepSize
        };
      } else if (this.app.Options.positioning === PositioningOptions.LEFT) {
        return {
          y: firstInRangePos + index * varyingStepSize,
          x: alignToPos.x - fixedStepSize
        };
      } else if (this.app.Options.positioning === PositioningOptions.DOWN) {
        return {
          x: firstInRangePos + index * varyingStepSize,
          y: alignToPos.y + fixedStepSize
        };
      } else if (this.app.Options.positioning === PositioningOptions.UP) {
        return {
          x: firstInRangePos + index * varyingStepSize,
          y: alignToPos.y - fixedStepSize
        };
      }
    });
    return positions;
  }

  private positionNextToOverlappingNodes(positions: { x, y }[], matchPos: { x, y }, checkNodes: IdType[]): { x, y }[] {
    let correctedPositions: { x, y }[] = [];
    let varyingPosKey = (this.app.Options.positioning === PositioningOptions.RIGHT || this.app.Options.positioning === PositioningOptions.LEFT) ? 'y' : 'x';
    let fixedPosKey = varyingPosKey === 'x' ? 'y' : 'x';

    let fixedPosToCheck =
      (this.app.Options.positioning === PositioningOptions.RIGHT || this.app.Options.positioning === PositioningOptions.DOWN) ?
        matchPos[fixedPosKey] + MatchDistance.toPreviousMatch() :
        matchPos[fixedPosKey] - MatchDistance.toPreviousMatch();

    const allMatchIdsOfSamePos = this.chart.getItems(checkNodes).nodes.filter(i =>
      (i[fixedPosKey] >= fixedPosToCheck - ChartConsts.gridBaseSize && i[fixedPosKey] <= fixedPosToCheck + ChartConsts.gridBaseSize)
    );
    if (allMatchIdsOfSamePos.length > 0) {
      const largestVaryingMatchPos = allMatchIdsOfSamePos.map(i => i[varyingPosKey]).sort((a, b) => {
        return b - a;
      })[0];
      const sortedPositions = positions.sort((a, b) => {
        return b[varyingPosKey] - a[varyingPosKey];
      });
      correctedPositions = sortedPositions.map((i, index) => {
        let newPos: { x, y } = {x: 0, y: 0};
        newPos[varyingPosKey] = largestVaryingMatchPos + MatchDistance.betweenMatches() * (index + 1);
        newPos[fixedPosKey] = i[fixedPosKey];
        return newPos;
      });
      return correctedPositions;
    } else {
      return positions;
    }

  }

  public positionNormal(addedItems: Array<Node | Edge>) {
    // file nodes
    let resultItems: Array<Node | Edge> = [];
    let fileNodes = addedItems.filter(i => ChartUtils.isFileNode(i));
    this.app.addFilesToLegend(fileNodes as Node[]);

    ///// match nodes //////
    // set positions of match nodes
    let alignToPos = this.app.selectedNode ? this.chart.getPosition(this.app.selectedNode.id) : {x: 0, y: 0};
    let matchNodes: Node[] = addedItems.filter((i) => ChartUtils.isMatchNode(i as Node)) as Node[];
    let positions: { x, y }[] = [];
    positions = this.getMatchNodesPositions(matchNodes, alignToPos);
    matchNodes = matchNodes.map((i, index) => {
      i.x = positions[index].x;
      i.y = positions[index].y;
      return i;
    });
    let hiddenFileNodes: { [nodeId: string]: Node } = {};

    let possibleOverlapNodes: IdType[];
    if (this.app.selectedNode) {
      possibleOverlapNodes = this.chart.getNeighboursByEdge(this.app.selectedNode.id, (edge: Edge) => true).nodes;
      possibleOverlapNodes = this.chart.getItems(possibleOverlapNodes).nodes.filter(i => ChartUtils.isMatchNode(i)).map(i => i.id);
    } else
      possibleOverlapNodes = this.chart.getAllMatchNodes().filter(i => (!i.x || i.x === 0)).map(i => i.id);

    positions = this.positionNextToOverlappingNodes(positions, alignToPos, possibleOverlapNodes);
    matchNodes = matchNodes.map((i, index) => {
      i.x = positions[index].x;
      i.y = positions[index].y;
      return i;
    });

    matchNodes.forEach((matchNode: Node) => {
      let ofFileNodeId = ChartUtils.getOfFileId(matchNode);
      let ofFileNode = fileNodes.find(i => i.id === ofFileNodeId);
      if (!ofFileNode) ofFileNode = ChartUtils.getOfFileNode(matchNode, this.chart);
      let ofFileItems = CreateUtils.createFileNameNode(ofFileNode.label, matchNode, ofFileNode.color as any, this.chart);
      resultItems = resultItems.concat(ofFileItems);
      hiddenFileNodes[ofFileNodeId] = ofFileNode as Node;
    });


    // hide file nodes with matches
    for (let key in hiddenFileNodes) {
      hiddenFileNodes[key].hidden = true;
    }
    // edges
    let edges = addedItems.filter(i => !ChartUtils.isNode(i));

    return resultItems.concat(matchNodes, fileNodes, edges);

  }

  public addToChartAndPosition(nodesAndLinks: Array<Node | Edge>, options: { moveBelowExisting } = {moveBelowExisting: true}): Array<Node | Edge> {
    let addedIds = nodesAndLinks.filter(i => {
      return (ChartUtils.isNode(i) && ChartUtils.isMatchNode(i as Node));
    }).map(i => i.id);

    let updatedNodes: Node[] = [];
    // update ones where atts changed
    let newNodesAndLinks = nodesAndLinks.map((item) => {
      let itemOnChart = this.chart.getItem(item.id);
      if (itemOnChart !== null) {
        ChartUtils.setAttributes(item as Node, ChartUtils.getMatchAttributes(item as Node));
        updatedNodes.push(item as Node);
        return null;
      }
      return item;
    }).filter(i => i !== null);

    // if invisible files exist, show them
    updatedNodes.forEach((i)=>{
      if(ChartUtils.isFileNode(i) && this.chart.getNeighbours(i.id).nodes.length===0) i.hidden = false
    })
    this.chart.nodes.update(updatedNodes);
    // position match nodes and file nodes
    // position non grouped matches horizontally. grouped matches will be positioned vertically.
    // grouped matches belong to existing file nodes and need to be positioned aligned to them
    newNodesAndLinks.filter(i => ChartUtils.isMatchNode(i as Node));
    newNodesAndLinks = this.positionNormal(newNodesAndLinks);

    console.log('added nodes and links', newNodesAndLinks);
    console.log(newNodesAndLinks.filter((i: Node) => ChartUtils.isMatchNode(i)).map((i: Node) => i.y));

    let currentMatches = this.chart.getAllMatchNodes();
    let isFirstAdded = false;
    if (this.chart.nodes.length === 0) isFirstAdded = true;
    this.chart.addNodesAndLinks(newNodesAndLinks, true);
    if (isFirstAdded) setTimeout(() => {
      this.chart.fitToNodes(newNodesAndLinks.map(i => i.id));
    }, 1000);

    setTimeout(() => {
      let addedMatches = newNodesAndLinks.filter((i: Node) => {
        return (ChartUtils.isNode(i) && ChartUtils.isMatchNode(i));
      });
      this.setInnerContentEdges((node: Node) => {
        return ChartUtils.getContentEndLine(node);
      }, ChartStyles.insideContentLink, ContentEdgeTypes.insideContent, addedMatches as Node[], currentMatches);
      // this.setInnerContentEdges((node: Node) => {
      //   return ChartUtils.getEndLineNumber(node);
      // }, ChartStyles.insideSelectionLink, ContentEdgeTypes.insideSelection, addedMatches as Node[], currentMatches);
      this.app.codeEditor.markMatchesInFile(this.getSeletedFileMatchesRows());
    }, 0);
    return nodesAndLinks;
  }

  private setInnerContentEdges(getOtherEndLine: (node: Node) => number, edgeStyle: any, edgeType: ContentEdgeTypes_type, addedMatches: Node[], existingMatches: Node[]) {
    let addedEdges: Edge[] = [];
    addedMatches.forEach(i => {
      existingMatches.forEach(j => {
        if (i.id === j.id) return;
        let otherEndLineNumber = getOtherEndLine(j);
        let otherLineNumber = ChartUtils.getLineNumber(j);
        let myLineNumber = ChartUtils.getLineNumber(i);
        let myEndLineNumber = getOtherEndLine(i);
        if (ChartUtils.getOfFileId(i) !== ChartUtils.getOfFileId(j)) return;
        let isInside = (myLine, otherLine, otherEndLine) => {
          return (otherEndLine && (myLine > otherLine && myLine < otherEndLine));
        };
        if (
          (myEndLineNumber && isInside(myEndLineNumber, otherLineNumber, otherEndLineNumber))
          ||
          isInside(myLineNumber, otherLineNumber, otherEndLineNumber)
        ) {
          addedEdges.push(this.chart.createLink(j.id, i.id, edgeStyle, {idPrefix: edgeType}));
        } else if ((otherEndLineNumber && isInside(otherEndLineNumber, myLineNumber, myEndLineNumber))
          ||
          isInside(otherLineNumber, myLineNumber, myEndLineNumber)
        ) {
          addedEdges.push(this.chart.createLink(i.id, j.id, edgeStyle, {idPrefix: edgeType}));
        }
      });
    });
    this.chart.addNodesAndLinks(addedEdges);
  }

  private setFileNodePos_Directional(node: Node, fileNodeIndex: number, largestYPos) {
    if (this.chart.getItem(node.id) && this.chart.getItem(node.id) !== null) return node;
    let xPos, yPos;
    if (largestYPos === undefined) {
      xPos = 0;
      yPos = ChartConsts.fileDistance.y * fileNodeIndex;
    } else {
      xPos = 0;
      yPos = ChartConsts.fileDistance.y * fileNodeIndex + largestYPos;
    }
    let fileNode = Object.assign(node, {
      x: xPos,
      y: yPos
    });
    return fileNode;
  }


  public clearChart() {
    this.app.chart.setData([], []);
    this.app.clearFilesInLegend();
  }

  public createShape(selectedNodeIds: IdType[], shapeType: string): Array<Node | Edge> {
    shapeType = shapeType.toLowerCase();
    let shapeInfo = ChartStyles.nodesTypes.find(i => i.name === shapeType)
    let shape = Utils.deepCopy(shapeInfo.details);
    this.chart.addToHistory(false);
    let selectedNodes = this.chart.getItems(selectedNodeIds).nodes;
    let addedItems = [];
    let newNode = this.chart.createNode(null, 'new remark', shape.node);
    newNode = ChartUtils.setDragWithParent(newNode)


    // node selected
    if (selectedNodes !== null && selectedNodes.length > 0) {
      let id = selectedNodes.map(i => i.id.toString()).reduce((total, current) => {
        return total + '_' + current;
      }, '');
      newNode.id = CreateUtils.createShapeId(shapeType, id)

      // position in middle of selected nodes
      let xPos = ChartUtils.getMiddlePoint(selectedNodes, 'x', this.chart);
      let yPos = ChartUtils.getMiddlePoint(selectedNodes, 'y', this.chart);
      this.chart.setNodePosition(newNode, {x: xPos, y: yPos});
      //if only one node selected, add above that node
      if (selectedNodes.length === 1)
        newNode.y = newNode.y - (selectedNodes[0].size ? selectedNodes[0].size / 2 : 13/*default is 25*/) - 35;
      addedItems.push(newNode);

      // create links for all nodes
      selectedNodes.forEach(node => {
        let newLink = this.chart.createLink(node.id, newNode.id, shape.link);
        addedItems.push(newLink);
      });
      // create file link - only if single node is selected
      if (shapeInfo.details.createLinkToFile && selectedNodes.length === 1) {
        let node = selectedNodes[0];
        if (ChartUtils.isOfFile(node) || ChartUtils.isFileNode(node)) {
          let fileNode;
          if (ChartUtils.isFileNode(node)) {
            fileNode = node.id;
          } else {
            fileNode = ChartUtils.getOfFileId(node);
          }
          let fileLink = CreateUtils.createFileEdge(this.chart, fileNode, newNode.id);
          ChartUtils.setOfFile(newNode, fileNode, this.chart);
          addedItems.push(fileLink);
        }
      }
    } /*no node selected*/ else {
      let id = shapeType + new Date().getTime()
      newNode.id = CreateUtils.createShapeId(shapeType, id)
      this.chart.setNodePosition(newNode, this.chart.getViewPos());
      addedItems.push(newNode);
    }
    this.chart.addNodesAndLinks(addedItems);
    return addedItems;
  }

  public setNodesStyle(nodes: Node[], newStyle: any) {
    let updatedNodes: Node[] = [];
    nodes.forEach((node) => {
      updatedNodes.push(ChartUtils.setNewStyleAndGet(node, newStyle));
    });
    this.chart.nodes.update(updatedNodes);
  }

  public setEdgesStyle(edges: Edge[], newStyle: any) {
    let updatedEdges: Edge[] = [];
    edges.forEach((edge) => {
      updatedEdges.push(ChartUtils.setNewStyleAndGet(edge, newStyle));
    });
    this.chart.edges.update(updatedEdges);
  }

  public setSelectionStyle(newStyle) {
    let selection = this.chart.getSelection()
    this.setNodesStyle(this.chart.getItems(selection.nodes).nodes, newStyle)
    this.setEdgesStyle(this.chart.getItems(selection.edges).edges, newStyle)
  }

  public loadNodePrevStyle(node) {
    if (!node.d.prevStyle) return;
    Object.keys(node.d.prevStyle).forEach(styleField => {
      node[styleField] = node.d.prevStyle[styleField];
      delete node.d.prevStyle[styleField];
    });
  }

  public getNeighborNodesIds(nodeId: IdType): IdType[] {
    return this.app.chart.getNeighbours(nodeId).nodes;
  }

  public getSurroundingEdgesIds(nodeId: IdType): IdType[] {
    return this.chart.getNeighbours(nodeId).edges;
  }

  public getOutlierNeighbours(nodes: Node[]): IdType[] {
    let returned:IdType[] = []
    nodes.forEach((node)=>{
      let neighborIds = this.chart.getNeighboursByEdge(node.id, (edge: Edge)=>{return !ChartUtils.isFileEdge(edge)}).nodes
      neighborIds.forEach((neighbourId)=>{
        let edgesOfNeighbourIds = this.chart.getNeighboursByEdge(neighbourId, (edge: Edge)=>{return !ChartUtils.isFileEdge(edge)}).edges
        if(edgesOfNeighbourIds.length===1) returned.push(neighbourId)
      })
    })
    return returned
  }

  public deleteSelected() {
    let selection = this.extendSelection(this.chart.getSelection());

    // get edges going out and into selected nodes, and also filename nodes
    let matchNodes: IdType[] = selection.nodes.filter(item => ChartUtils.isMatchNode(this.chart.getNode(item)));
    let newEdges: Edge[] = [];
    matchNodes.forEach((nodeId) => {
      let connectedEdgeIds = this.chart.getNeighbours(nodeId).edges;
      let conncetedEdges = [...this.chart.getItems(connectedEdgeIds).edges];
      let connectedToMatchEdges = conncetedEdges.filter((i) => {
        return ChartUtils.isMatchEdge(i);
      }).filter(i => i.to === nodeId);
      let edgesFromMatchToIds = conncetedEdges.filter((i) => {
        return ChartUtils.isMatchEdge(i);
      }).filter(i => i.from === nodeId).map(i => i.to);
      connectedToMatchEdges.forEach((edge) => {
        edgesFromMatchToIds.forEach((toId) => {
          let newEdge = Utils.deepCopy(edge) as Edge;
          newEdge.to = toId;
          newEdge.id = newEdge.id.toString().replace(nodeId.toString(), toId.toString());
          newEdges.push(newEdge);
        });
      });
    });
    this.app.removeFilesFromLegend(this.chart.getItems(selection.nodes).nodes.filter(i=>ChartUtils.isFileNode(i)))
    this.chart.deleteItems(selection);
    this.chart.addNodesAndLinks(newEdges);
    this.app.codeEditor.markMatchesInFile(this.getSeletedFileMatchesRows());
  }

  public extendSelection(selection: {nodes: IdType[], edges: IdType[]}): {nodes: IdType[], edges: IdType[]} {
    let returnedSelection: {nodes: IdType[], edges:IdType[]} = Utils.deepCopy(selection)
    // match nodes of file
    let fileNodes: IdType[] = selection.nodes.filter(item => ChartUtils.isFileNode(this.chart.getNode(item)));
    fileNodes.forEach(node => {
      let matchNodeIds = this.getFileNodeMatcheNodes(this.chart.getNode(node)).map(i => i.id);
      returnedSelection.nodes = returnedSelection.nodes.concat(matchNodeIds)
    });

    // // get end neighbors nodes of matches
    let matchNodes: IdType[] = returnedSelection.nodes.filter(item => ChartUtils.isMatchNode(this.chart.getNode(item)));
    matchNodes.forEach((nodeId) => {
      let connected = this.getOutlierNeighbours(this.chart.getItems([nodeId]).nodes)
      connected = this.chart.getItems(connected).nodes.filter((node)=>{return ChartUtils.isDragWithParent(node) || ChartUtils.isFilenameNode(node)}).map(i=>i.id)
      returnedSelection.nodes = returnedSelection.nodes.concat(connected)
    });


    return returnedSelection
  }

  public getSelectedLinksOrNodesOnly() {
    let chartSelection = this.chart.getSelection();
    if (chartSelection.nodes.length > 0) {
      return {edges: [], nodes: chartSelection.nodes};
    } else {
      return {edges: chartSelection.edges, nodes: []};
    }
  }

  public undo() {
    this.chart.undo();
  }

  setPathNode(node: Node | Edge) {
    if (1 === 1) return node;
    // need to fix this later, look for commit of path node
  }

  isPathNode(node: Node) {
    return (ChartUtils.getMatchAttributes(node).pathNodeAttribute);
  }

  isPathEdge(edge: Edge) {
    return (this.isPathNode(this.chart.getItem(edge.to) as Node)
      &&
      this.isPathNode(this.chart.getItem(edge.from) as Node));
  }

  public setSelectedAsPath() {
    if (this.app.selectedNode === null) return;
    this.setPathNode(this.app.selectedNode);
  }

  public getNodeContent(node): ContentOfMatch {
    let nodeLine = ChartUtils.getLineNumber(node);
    let endLine = Utils.getEndLineOfBlock(this.app.currentFile.lines, nodeLine);
    let content = endLine ? this.app.currentFile.lines.slice(nodeLine, nodeLine + endLine).join('\r\n') : this.app.currentFile.lines[nodeLine];

    return {
      content: content,
      startIndex: nodeLine,
      endIndex: endLine
    };
  }

  public setNodeTitle(node: Node, title) {
    let lineNumber = ChartUtils.getLineNumber(node);
    let endLineNumber = ChartUtils.getEndLineNumber(node);
    if (lineNumber) {
      let linesMatch = title.match(/\(\d+(-\d+)?\):/gi);
      let titleNoLineNumbers = '';
      if (linesMatch) titleNoLineNumbers = title.substring(linesMatch[0].length, title.length);
      else titleNoLineNumbers = title;
      this.chart.setLabel(node, title);
    } else {
      this.chart.setLabel(node, title);
    }
  }

  public getFileNodeMatcheNodes(fileNode: Node, includeFilenameNodes = true): Node[] {
    let matchNodes = []// = this.chart.getItems(this.chart.getNeighbours(fileNode.id).nodes).nodes.filter(i => ChartUtils.isMatchNode(i));
    matchNodes = matchNodes.concat(this.chart.getAllMatchNodes().filter(i=>ChartUtils.getOfFileId(i)===fileNode.id))
    let distinctMatchNodes = matchNodes.filter(Utils.onlyUnique)
    if (!includeFilenameNodes) return distinctMatchNodes;
    let filenameNodes: Node[] = [];
    matchNodes.forEach((i) => {
      let filenameNodeId = ChartUtils.getFilenameNodeId(i, this.chart);
      if (!filenameNodeId) return;
      filenameNodes.push(this.chart.getNode(filenameNodeId));
    });
    return filenameNodes.concat(matchNodes);
  }

  public getSeletedFileMatchesRows(): { startRowNumber, endRowNumber }[] {
    if (!this.app.currentFile) return [];
    return this.getFileNodeMatcheNodes(this.app.currentFile.node as Node, false).map(i => {
      return {
        startRowNumber: ChartUtils.getLineNumber(i),
        endRowNumber: ChartUtils.getEndLineNumber(i)
      };
    });

  }

  //Global_app.chart.getAllItemIds().edges.filter(i=>i.startsWith("inside content"))
  //var otherEdges = Global_app.chart.getAllItemIds().edges.filter(i=>{return (i.startsWith("match") || i.startsWith("user"))})

  getMatchNodeOfLineNumber(lineNumber: number): Node {
    return this.chart.getAllMatchNodes().find(i => {
      let matchStartRow = ChartUtils.getLineNumber(i);
      let endMatchRow = ChartUtils.getEndLineNumber(i);
      if (endMatchRow) {
        return (lineNumber > matchStartRow && lineNumber < endMatchRow);
      } else {
        return lineNumber === matchStartRow;
      }
    });
  }

  groupUngroupFile(node: Node) {
    if (!node) {
      console.log('no selected node');
      return;
    }
    let fileNode = ChartUtils.getOfFileNode(node, this.chart);
    if (!fileNode) {
      if (ChartUtils.isFileNode(node)) fileNode = Utils.deepCopy(node);
      else {
        console.log('no of file node');
        return;
      }
    }
    if (ChartUtils.getFileNodeIsGrouped(node)) {
      ChartUtils.setFileNodIsGrouped(node, false);
      ChartUtils.setFileNodIsGrouped(fileNode, false);
      this.getFileNodeMatcheNodes(fileNode).forEach((i) => {
        if (!ChartUtils.getFilenameNodeId(i, this.chart) && ChartUtils.isMatchNode(i)) {
          let filenameItems = CreateUtils.createFileNameNode(fileNode.label, i, fileNode.color, this.chart);
          this.chart.addNodesAndLinks(filenameItems);
        }
      });
      fileNode.hidden = true;
    } else {
      ChartUtils.setFileNodIsGrouped(node, true);
      ChartUtils.setFileNodIsGrouped(fileNode, true);
      let fileMatches = this.getFileNodeMatcheNodes(fileNode, false);
      fileNode.hidden = false;
      this.app.recalulateRectangles = true
      fileNode.y = ChartUtils.getMiddlePoint(fileMatches, 'y', this.chart);
      fileNode.x = fileMatches.sort((a, b) => {
        return a.x - b.x;
      })[0].x - 500;
    }
    this.chart.nodes.update(fileNode);
  }

  selectMatchesOfLine(row: number, fileNode: Node) {
    let matches = this.getFileNodeMatcheNodes(fileNode);
    matches = matches.filter((match: Node) => {
      return ChartUtils.getLineNumber(match) === row;
      // if (ChartUtils.getEndLineNumber(match)) {
      //   return ChartUtils.getLineNumber(match) <= row && ChartUtils.getEndLineNumber(match) >= row;
      // } else {
      //   return ChartUtils.getLineNumber(match) == row;
      // }
    });
    if (matches.length) this.chart.setSelectionNodes(matches.map(i => i.id));
  }

  reloadAllFileNodes(files: ReloadFilesResponse[], options: ReloadOptions = {}) {
    options = Object.assign({addFailedReloadToDiagram: true, markNullFiles: true}, options)
    let failedReloadItems: Array<Node | Edge> = []
    files.forEach(file => {
      failedReloadItems = failedReloadItems.concat(this.reloadSingleFileNode(this.chart.getNode(file.file) as FileNode, file, options));
    });
    if (options.addFailedReloadToDiagram) {
      this.chart.addToHistory(false);
      this.chart.addNodesAndLinks(failedReloadItems, true);
      this.app.currentFile = null
    }
    this.app.addMessage(`Finished loading ${this.app.searchObject.dirPath}`,
      `Reloaded ${files.filter(i=>i.content!==null).length} files.
      ${files.filter(i=>!i.content).length} files were missing`, 3000)
  }

  reloadSingleFileNode(fileNode: FileNode, newFile: ReloadFilesResponse, options: ReloadOptions): Array<Node | Edge> {
    options = Object.assign({markNullFiles:true}, options)
    let returnedItems: Array<Node | Edge> = [];
    let addFailedReloadToReturned = (node: Node, newLineText) => {
      // if failed reload indicator exists, update it, else create a refresh failed indicator
      let existingIndicators = this.chart.getNeighboursByEdge(node.id, (edge)=>ChartUtils.isFailedRefreshIndicatorEdge(edge))
      if(existingIndicators.nodes.length>0) {
        let indicatorNode = this.chart.getItem(existingIndicators.nodes[0])
        indicatorNode['d'].line = newLineText
        returnedItems = returnedItems.concat(indicatorNode, existingIndicators.edges[0] as Edge);
      } else {
        let failed = CreateUtils.createFailedRefreshNode(node, this.chart, newLineText);
        returnedItems = returnedItems.concat(failed.node, failed.edge);
      }
    };
    // sort matches of file by line number, add offset field for later use
    let sortedMatchNodes: { node: Node, startOffset, endOffset, contentOffset }[] = this.getFileNodeMatcheNodes(fileNode, false)
      .sort((a, b) => ChartUtils.getLineNumber(a) - ChartUtils.getLineNumber(b))
      .map(i => {
        return {node: i, startOffset: 0, endOffset: 0, contentOffset: 0};
      });

    // no file was found (the file does`nt exist) - mark all matches as failed
    if (!newFile.content && options.markNullFiles) {
      sortedMatchNodes.forEach(match => {
        addFailedReloadToReturned(match.node, null);
      });
      return returnedItems;
    }

    // get current file content
    let currentFileContent = ChartUtils.getFileNodeContent(fileNode);

    fileNode.d.fileContent = newFile.content
    returnedItems.push(fileNode)

    if (sortedMatchNodes.length === 0) {
      console.error(`no matches found for file ${newFile.file}`);
      return [];
    }

    let sortedMatchNodesEndLines = []
    let sortedMatchNodesContentLines = []
    sortedMatchNodes.forEach(i=>{if(ChartUtils.getEndLineNumber(i.node)) sortedMatchNodesEndLines.push(i)})
    sortedMatchNodes.forEach(i=>{if(ChartUtils.getContentEndLine(i.node)) sortedMatchNodesContentLines.push(i)})
    let startLineMatchNodeIndex = 0;
    let endLineMatchNodeIndex = 0;
    let contentLineMatchNodeIndex = 0;
    let currentMatchStartLine = () => { return ChartUtils.getLineNumber(sortedMatchNodes[startLineMatchNodeIndex].node); };
    let currentMatchEndLine = () => { return ChartUtils.getEndLineNumber(sortedMatchNodes[endLineMatchNodeIndex].node); };
    let currentMatchContentLine = () => { return ChartUtils.getContentEndLine(sortedMatchNodes[contentLineMatchNodeIndex].node); };
    let lineOffset = 0;
    let indexInOriginalContent = 0
    // calculate offset for each match. we go over the merged lines, increasing/decreasing offset as we meet '+'/'-'.
    // we increase these in the matching match nodes by checking line number
    let diffAsArray = this.diff(currentFileContent, newFile.content).split('\n')
    let currentFileContentAsArray = currentFileContent.split('\n')
    diffAsArray.forEach((diffLine, index) => {
      if (startLineMatchNodeIndex == sortedMatchNodes.length) return;
      // console.log('------------------------------')
      // console.log(index, diffLine)
      // console.log(indexInOriginalContent, currentFileContentAsArray[indexInOriginalContent])
      // console.log(currentMatchStartLine(), sortedMatchNodes[startLineMatchNodeIndex].node['d'].line)

      if (diffLine.startsWith('+')) {lineOffset++; return;}


      if (indexInOriginalContent === currentMatchStartLine()) {
        console.log('updated start offset')

        sortedMatchNodes[startLineMatchNodeIndex].startOffset = lineOffset;
        startLineMatchNodeIndex++;
      }
      if(currentMatchEndLine() && indexInOriginalContent == currentMatchEndLine()) {
        console.log('updated end offset')

        sortedMatchNodesEndLines[endLineMatchNodeIndex].endOffset = lineOffset;
        endLineMatchNodeIndex++;
      }
      if(currentMatchContentLine() && indexInOriginalContent == currentMatchContentLine()) {
        console.log('updated content offset')

        sortedMatchNodesContentLines[contentLineMatchNodeIndex].contentOffset = lineOffset;
        contentLineMatchNodeIndex++;
      }

      if (diffLine.startsWith('-')) lineOffset--
      indexInOriginalContent++
    });


    let changedNodes = sortedMatchNodes.map(i => {
      let changedInfo: MatchInfo = i.node['d'] as MatchInfo;
      changedInfo.lineNumber += i.startOffset;
      if(changedInfo.endLineNumber) changedInfo.endLineNumber += i.endOffset
      if(changedInfo.endContentLine) changedInfo.endContentLine += i.contentOffset
      return i.node;
    });

    // update matches and file node
    returnedItems = returnedItems.concat(changedNodes);

    // add failed for matches still not matching the text
    let newFileContentAsArray = newFile.content.split('\n')
    changedNodes.forEach((i) => {
      let lineNumber = ChartUtils.getLineNumber(i);
      let newLineText = newFileContentAsArray[lineNumber].trim()
      let originalLineText = ChartUtils.getLine(i).trim()
      if (newLineText !== originalLineText)
        addFailedReloadToReturned(i, originalLineText);
    });

    return returnedItems;
  }

  clearFailedReloadNodesIndicators() {
    let indicatorNodes = this.chart.getNodes((i)=>{return ChartUtils.isFailedRefreshIndicator(i)}, 'id') as IdType[]
    indicatorNodes.forEach((i)=>{
      let matchNodes = this.chart.getNeighboursByEdge(i, (edge)=>{
        return ChartUtils.isFailedRefreshIndicatorEdge(edge)
      }).nodes
      if(matchNodes.length>0) {
        // very inefficient - we should collect these and update all nodes in one go!!!
        ChartUtils.setLine(this.chart.getItem(matchNodes[0]) as Node, this.chart.getItem(i)['d'].newLineText, this.chart)
      } else {
        console.warn(`could'nt find match of failed node ${i}`)
      }
    })
    this.chart.deleteItems({nodes: indicatorNodes, edges: []})
  }

}
