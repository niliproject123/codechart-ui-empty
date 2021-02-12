import { ChartActions, PositioningOptions } from './chart.actions';
import { AttributesKey, ChartUtils } from './chart.utils';
import { ChartWrapper } from './chart.wrapper';
import { CreateUtils } from './create.utils';
import { AppComponent } from '../app.component';
import { Edge, Node } from 'vis';
import {
  CreateTypes,
  EndPoints,
  FindInFilesResponse,
  MatchInfo,
  ReloadRequest,
  SaveJson,
  SaveNode,
  SaveNodesResponse,
  FileNode, ReloadFilesResponse, SaveToCodeRequest
} from '../types.nodejs';
import { HttpClient } from '@angular/common/http';
import { ChartConsts, ChartStyles } from './chart.consts';
import { RelativeTimeFuturePastVal } from 'moment';
import { Utils } from './Utils';
import { CreateDiagramDto, QueryDto, ResultDiagramUI } from '../services/SaveLoadService';
import { RouteConfigLoadEnd } from '@angular/router';
import { Env } from '../utils/Env';

interface DownloadInterface { info: QueryDto, dirPath, positioning, nodes, edges }

export class SaveLoad {
  private chart: ChartWrapper;
  private chartActions: ChartActions;

  constructor(private app: AppComponent, public http: HttpClient) {
  }

  initialize() {
    this.chart = this.app.chart;
    this.chartActions = this.app.chartActions;
  }

  public loadDataFromFindInFiles(response: FindInFilesResponse[]) {
    let matchCount = response.reduce((soFar, item) => { return soFar + item.matches.length }, 0)
    this.app.addMessage('search results', 'found ' + matchCount + ' matches in ' + response.length + ' files', 2000)
    console.log('find in files response', response)
    let addedNodesAndLinks = []
    this.chart.addToHistory(true)
    let fileColors = this.app.getLegendColors()
    response.forEach((file: FindInFilesResponse) => {
      let fileNode = CreateUtils.createFileNode(file, this.chart, fileColors, this.app.selectedNode ? ((this.app.selectedNode as Node).x - 300) : this.chart.getViewPos().x);
      if (this.chart.getItem(fileNode.id)) fileNode = this.chart.getItem(fileNode.id) as FileNode
      fileColors.push(fileNode.color.border)
      addedNodesAndLinks.push(fileNode);

      file.matches.forEach((match: MatchInfo) => {
        let matchNodes = CreateUtils.createOrUpdateMatchNode(match, fileNode.id, this.chart, this.app.selectedNode as Node);
        addedNodesAndLinks = addedNodesAndLinks.concat(matchNodes);
      });
    });

    this.chartActions.addToChartAndPosition(addedNodesAndLinks);
    // setTimeout(()=>{
    //   let matchNodes = addedNodesAndLinks.filter(i=>ChartUtils.isMatchNode(i)).map(i=>i.id)
    //   this.chart.fitToNodes(matchNodes)
    // }, 1000)

  }

  public reloadFiles(fileNodes: FileNode[]) {
    //only  get file paths which exist in current selected folder/project
    let allFilePaths = fileNodes.map(item => {
      return { file: ChartUtils.getFilePath(item) };
    })
    let pathsInCurrentDir = []
    allFilePaths.forEach((suspectPath) => {
      for (let path in this.app.availableFiles) {
        if (this.app.availableFiles[path].indexOf(suspectPath.file) !== -1) {
          pathsInCurrentDir.push(Utils.deepCopy(suspectPath))
          continue
        }
      }
    })
    let reloadData: ReloadRequest = {
      matches: [],
      files: pathsInCurrentDir,
      dirPath: this.app.searchObject.dirPath
    }
    this.http.post(Env.getApiEndpoint() + EndPoints.reloadFiles, reloadData).subscribe((response: { files: ReloadFilesResponse[] }) => {
      console.log('load response', response);
      this.app.selectedNode = null;
      this.chartActions.reloadAllFileNodes(response.files, { markNullFiles: false })
    });
  }



  public _reload() {
    let allNodes = this.chart.nodes.get();
    let reloadData: ReloadRequest = {
      matches: allNodes.filter(node => {
        return !ChartUtils.isFileNode(node);
      }).map(item => {
        return ChartUtils.getMatchAttributes(item);
      }),
      files: allNodes.filter(node => {
        return ChartUtils.isFileNode(node);
      }).map(item => {
        return { file: ChartUtils.getFilePath(item) };
      }),
      dirPath: this.app.searchObject.dirPath
    };
    // check for duplicates - if same id was copied to different location
    let duplicates = reloadData.matches.filter((item, index) => reloadData.matches.indexOf(item) != index)
    if (duplicates.length !== 0) {
      this.app.addMessage('Error', 'duplicates', 1000)
      console.log('duplicate ids in reload', duplicates)
      return
    }
    this.http.post(Env.getApiEndpoint() + EndPoints.loadFromCode, reloadData).subscribe((response: FindInFilesResponse[]) => {
      console.log('load response', response);
      this.app.selectedNode = null;
      this.loadDataFromFindInFiles(response);
    });
  }

  public saveChartToJson(diagramData: QueryDto) {
    let savedData = this.prepareNodesAndEdgesForSave()
    let jsonContent: DownloadInterface = { info: diagramData, nodes: savedData.nodes, edges: savedData.edges, dirPath: this.app.searchObject.searchPath, positioning: this.app.Options.positioning };
    this.saveJsonToFile(jsonContent, diagramData.story)
  }

  public prepareNodesAndEdgesForSave(): { nodes, edges } {
    let setNodesForSave = (item: Node) => {
      if (item.icon && item.icon.code) {
        item.icon.code = "//" + item.icon.code
      }
      let itemPos = this.chart.getPosition(item.id);
      if (!itemPos) return item as Node
      item.x = itemPos.x
      item.y = itemPos.y
      return item
    }
    let jsonSavedEdges = this.chart.edges.get().map((edge: Edge) => {
      return edge
    });
    let jsonSavedNodes = this.chart.nodes.get().map((node: Node) => {
      this.chart.setNodePosition(node, this.chart.getPosition(node.id))
      return setNodesForSave(node);
    });
    return {
      nodes: jsonSavedNodes,
      edges: jsonSavedEdges
    }
  }

  public loadFromJson(jsonEvt) {
    // remove illegal chars from json. these can appear in content of saved files
    let parsed = null
    let result = jsonEvt.target['result'].trim()
    let lastException = null
    let reparseTries = 0
    let retry = true
    let badPos = 0

    while (retry && reparseTries < 1000) {
      try {
        console.log(result.substring(badPos - 15, badPos + 15))
        parsed = JSON.parse(result)
        retry = false
      } catch (ex) {
        if (ex.message.match(/at position \d+/) && ex.message.match(/\d+/)) {
          badPos = parseInt(ex.message.match(/\d+/)[0])
          result = result.slice(0, badPos) + result.slice(badPos + 1)
          retry = true
          reparseTries++
        } else {
          retry = false
        }
        lastException = ex
      }
    }
    if (parsed === null) {
      console.error('failed loading json', lastException)
      return
    }

    // new format
    let loaded: { nodes, edges, dirPath, positioning } = { nodes: [], edges: [], dirPath: '', positioning: '' }
    if (parsed.info) {
      this.app.currentDiagramDetails = parsed.info
    }
    loaded.dirPath = parsed.dirPath
    Utils.addIfNotExist(this.app.currentDiagramDetails.projectList, parsed.dirPath)
    // old format
    loaded.nodes = parsed.nodes
    loaded.edges = parsed.edges
    if (loaded.positioning) {
      this.app.Options.positioning = loaded.positioning
    } else {
      this.app.Options.positioning = PositioningOptions.DOWN
    }
    this.app.searchObject.dirPath = loaded.dirPath
    Utils.addIfNotExist(this.app.currentDiagramDetails.projectList, loaded.dirPath)
    this.load({ nodes: loaded.nodes, edges: loaded.edges });
  }


  public loadFromDb(diagram: ResultDiagramUI, id: number) {
    this.load({ nodes: diagram.data.nodes, edges: diagram.data.edges });
    delete diagram['data']
    this.app.currentDiagramDetails = Object.assign({ projectList: [] }, diagram)
  }

  public saveToCode(files: { name, content }[]) {
    let filesReq: SaveToCodeRequest = { dirPath: this.app.searchObject.dirPath, files: files.map(i => { return { file: i.name, content: i.content } }) }
    this.http.post(Env.getApiEndpoint() + EndPoints.saveToCode, filesReq).subscribe((response: { files: ReloadFilesResponse[] }) => {
      this.app.addMessage("saved to code - reloading", "", 5000)
      this.chartActions.reloadAllFileNodes(response.files, { markNullFiles: false })
    });
  }

  public saveToCode2() {
    let saveToFileJson: SaveJson = this.createSaveToCodeSentData();
    this.http.post(Env.getApiEndpoint() + EndPoints.saveToCode2, saveToFileJson).subscribe((saveToFileResponse: SaveNodesResponse[]) => {
      this.app.addMessage("saved to code", "", 5000)
    });
  }

  public fullSaveToFile(filename) {
    let saveToFileJson: SaveJson = this.createSaveToCodeSentData();
    this.http.post(Env.getApiEndpoint() + EndPoints.saveToCode2, saveToFileJson).subscribe((saveToFileResponse: SaveNodesResponse[]) => {
      handleNodesIdsDifferentThanSavedIds(saveToFileResponse);
    });

    let handleNodesIdsDifferentThanSavedIds = (response: SaveNodesResponse[]) => {
      if (Array.isArray(response) && response.length > 0) {
        console.log('saved ids different than existing ids:', response);
      }
      this.saveChartToJson(filename);
      let resetIdsFuncPerhapsUseThis = (jsonResponse) => {
        jsonResponse.forEach(updatedId => {
          console.log('save response', jsonResponse);
          let currentId = updatedId.savedId;
          let node = this.chart.getItem(currentId) as Node;
          let nodePositions = this.chart.getPosition(currentId);
          node.id = updatedId.exisitingId;
          let nodeEdges = this.chart.getItems(this.chartActions.getSurroundingEdgesIds(currentId)).edges.map(edge => {
            if (edge.from === currentId) edge.from = updatedId.exisitingId;
            else edge.to = updatedId.exisitingId;
            return edge;
          });

          this.chart.deleteItems({ nodes: [currentId], edges: [] });
          let newNodes = ([node] as Array<Node | Edge>).concat(nodeEdges);
          console.log('deleted and added', currentId, newNodes);
          setTimeout(() => {
            this.chart.addNodesAndLinks(newNodes);
          }, 0);
        });

      };
    };
  }

  public load(loaded: { nodes: Node[], edges: Edge[] }) {
    if (!this.app.Options.keepChartOnLoadFromJson) this.chartActions.clearChart();

    loaded.nodes = loaded.nodes.map((node: Node) => {
      try {
        if (ChartUtils.isMatchNode(node)) {
          let sameNode = ChartUtils.getSameMatch(this.chart, ChartUtils.getMatchAttributes(node), ChartUtils.getOfFileId(node))
          if (sameNode) {
            loaded.edges.push(this.chart.createLink(node.id, sameNode.id, ChartStyles.suspectedSameMatchLink, { idPrefix: "sameMatch" }))
          }
        }
      } catch (err) {
        console.log('error in node', node)
      }
      return node
    })
    console.log('loading nodes', loaded.nodes);
    this.chart.simpleLoadFromJson(loaded, {
      fitToAll: true,
      selectLoaded: this.chart.nodes.length > 0 && this.app.Options.keepChartOnLoadFromJson
    });
    // setTimeout(()=>{this.chart.fitToNodes(loaded.nodes.map(i=>i.id))}, 0)
  }

  private createSaveToCodeSentData(): SaveJson {
    let savedNodes: SaveNode[] = this.chart.nodes.get().map((node: Node) => {
      return CreateTypes.createSaveNode(ChartUtils.getLineNumber(node) as number, ChartUtils.getOfFileId(node), node.id as string);
    });
    return { nodes: savedNodes, dirPath: this.app.searchObject.dirPath };
  }

  public saveJsonToFile(jsonObject, filename: string) {
    let encode = (s) => {
      var out = [];
      for (var i = 0; i < s.length; i++) {
        out[i] = s.charCodeAt(i);
      }
      return new Uint8Array(out);
    }

    var data = encode(JSON.stringify(jsonObject, null, 4));

    var blob = new Blob([data], {
      type: 'application/octet-stream'
    });

    let url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);

    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    link.dispatchEvent(event);
  }
}
