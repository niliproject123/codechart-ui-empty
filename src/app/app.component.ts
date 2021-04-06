///aaaa///
import { AutoComplete, DataTableModule, Dropdown } from 'primeng/primeng'
import { Component, OnInit, AfterViewInit, ViewChild,HostListener } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { SearchActions } from './search/search.actions'
import {
  ChartConsts,
  ChartStyles,
  NodeStyles,
  ChartStyle,
  allNodeIcons,
  allNodeIconImages,
  NodeShapes,
} from './chart/chart.consts'
import { StartSearchJson, TypeMapping, typesMapping } from './chart/jsons'
import { JsonPipe } from '@angular/common'
import { Network, DataSet, Node, Edge, IdType, NetworkEvents } from 'vis'
import { ChartUtils, AttributesKey } from './chart/chart.utils'
import { ChartActions, PositioningOptions } from './chart/chart.actions'
import { Ace } from 'ace-builds'

export interface Shape {
  name: string
  details: { tooltip; node; link; class }
}

const pathStorageKey = 'selectedPath'

export interface CurrentFile {
  content: string
  name: string
  lines: string[]
  node: Node
}

export interface messageBoxItem {
  title: string
  message: string
  displayTime: number
}

export interface fileLegendItem {
  color
  fileNodeId
  fileLabel
}

import * as $ from 'jquery'
import { CreateUtils } from './chart/create.utils'
import { SaveLoad } from './chart/save.load'
import {
  MatchInfo,
  SaveNode,
  SaveJson,
  CreateTypes,
  FindInFilesResponse,
  SaveNodesResponse,
  EndPoints,
  SearchObject,
  FileNode,
} from './types.nodejs'
import { keyframes } from '@angular/core/src/animation/dsl'
import {
  SearchOptions,
  PreSeacrhJsonsUtils,
  Languages,
} from './search/search.jsons'
import { AreaSelect } from './chart/area.select'
import { Utils } from './chart/Utils'
import { CodeViewerComponent } from './code-viewer/code-viewer.component'
import { ChartStylingUtils } from './chart/chart.styling'
import { AppInterceptorsService } from './services/AppInterceptorService'
import {
  CreateDiagramDto,
  QueryDto,
  ResultDiagramUI,
  SaveLoadService,
} from './services/SaveLoadService'
import { ChartWrapper, EventItem } from './chart/chart.wrapper'
import { Env } from './utils/Env'
import { SelectItem } from 'primeng/primeng';

export const Options = {
  printFileNames: false,
  fillFileRect: false,
  drawFileRect: true,
  positioning: PositioningOptions.DOWN,
  showFileLegend: true,
  showCodeLabels: false,
  replaceClickedWithSelection: false,
  keepChartOnLoadFromJson: false,
  showInContentLines: false,
}

export interface SelectedDiagramInfo extends QueryDto {
  id: number
  projectList: string[]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [JsonPipe],
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('openfileInput') private openfileInput: AutoComplete
  @ViewChild('aceEditor') public codeEditor: CodeViewerComponent
  @ViewChild('searchResultsCodeEditor')

  public searchResultsCodeEditor: CodeViewerComponent
  public PositioningOptions = PositioningOptions

  public filerFullscreen = false
  public chartFullscreen = false
  public chart: ChartWrapper = new ChartWrapper(this)
  public chartActions = new ChartActions(this)
  public chartStyling = new ChartStylingUtils(this)
  public searchActions = new SearchActions(this)
  public saveLoad = new SaveLoad(this, this.http)
  public areaSelect = new AreaSelect(this)
  public paths = []
  public openFileVisible = false
  public saveJsonVisible = false
  public showDiagramsLoadTable = false
  public currentDiagramDetails: SelectedDiagramInfo = {
    id: -1,
    projectList: [],
  }
  public saveFullVisible = false
  public showFindResults = false
  public findResults: {
    findResults: FindInFilesResponse[]
    totalMatchCount: number
  } = { findResults: [], totalMatchCount: 0 }
  public diagramsList: ResultDiagramUI[] = []

  private _searchJson: SearchObject = StartSearchJson
  public selectedNodeSize = ''

  public shapes: Shape[] = ChartStyles.nodesTypes
  public linkTypes = Object.keys(ChartStyles.linkTypes)
  public nodeStyles = NodeStyles
  public filesInLegend: fileLegendItem[] = []

  public typesMapping: TypeMapping[] = null
  public showNodeEditBox = false

  public currentFile: CurrentFile = null
  private messageBoxElement: HTMLElement

  public titleElement: HTMLElement = null

  public previousSelectedNode: Node | Edge = null
  public previousDblClickedNode: Node | Edge = null
  public lastDblClickedNode: Node | Edge = null

  public _markedText: string = null

  public availableFiles: string[] = []
  public openFileSuggestions: string[] = []
  private loadResultsCallback: any
  // for debugging
  public ChartUtils = ChartUtils
  public Utils = Utils
  public Options = Options

  public selectedLanguageRegexes: SearchOptions[]
  public dropdownLanguageSelection: { label; value }[] = []
  public dropdownLanguageRegexSelection: { label; value }[] = []

  private languageRegexes: Languages[] = []
  public loadedDiagrams: string[] = []

  public lastDiagramLoaded: string = ''
  public
  
  view_settings = [];
  view_actions = [];
  diagram_actions = [];
  users = []
  selectedUser: User = null;

  // config = {
    
  //   displayKey: "name", //if objects array passed which key to be displayed defaults to description
  //   search: true, //true/false for the search functionlity defaults to false,
  //   height: "auto", //height of the list so that if there are more no of items it can show a scroll defaults to auto. With auto height scroll will never appear
  //   placeholder: "Select items", // text to be displayed when no item is selected defaults to Select,
  //   //customComparator: () => {}, // a custom function using which user wants to sort the items. default is undefined and Array.sort() will be used in that case,
  //   //limitTo: 2 // a number thats limits the no of options displayed in the UI similar to angular's limitTo pipe
  //   //moreText: "more items", // text to be displayed whenmore than one items are selected like Option 1 + 5 more
  //   noResultsFound: "No results found yet!", // text to be displayed when no items are found while searching
  //   searchPlaceholder: "Search Element" // label thats displayed in search input
  // };
  constructor(
    public http: HttpClient,
    private jsonPipe: JsonPipe,
    private httpInterceptService: AppInterceptorsService,
    public saveLoadService: SaveLoadService
  ) {
    this.searchObject = StartSearchJson
    this.typesMapping = typesMapping
    this._searchJson.isRegex = false

    this.httpInterceptService.setAppComponent(this)
    window['Global_app'] = this

  }


  ngAfterViewInit(): void {
    let resizeWindow = () => {
      // document.getElementById('filer').style.height = ($(window).height() - document.getElementById('topbox').clientHeight - 40) + 'px';
      document.getElementById('filer').style.height = $(window).height() + 'px';
    };
    resizeWindow();
    window.addEventListener('resize', () => {
      resizeWindow();
    });

    let inputCollection = document.getElementsByTagName('input');
    for (let i = 0; i < inputCollection.length; i++) {
      inputCollection[i].addEventListener('keyup', (e) => {
        e.stopPropagation();
      });
    }

    let chartElement = document.getElementById('vis_element');

    this.chart.setUp(chartElement);

    this.initializeData()
  }

  async initializeData() {
    const paths = {
      "paths": [
        "C:\\visualizer\\visualizer-angular\\src\\app\\",
        "C:\\visualizer\\demos\\agents",
        "C:\\visualizer\\visualizer-node\\node\\src\\",
        "C:\\DEV\\obtigo\\obtigo-new\\obtigo-app\\obtigo-ui\\src\\app\\",
        "C:\\DEV\\obtigo\\obtigo-new\\obtigo-app\\obtigo-api\\src\\",
        "C:\\DEV\\obtigo\\obtigo-new\\obtigo-app\\rss-crawler\\src\\",
        "C:\\DEV\\obtigo\\obtigo-new\\obtigo-app\\rss-project",
        "C:\\DEV\\omnix\\omnix 5\\fusion-etl-core\\",
        "C:\\DEV\\omnix\\omnix 5\\fusion-etl-monitoring\\monitor-api\\src",
        "C:\\DEV\\obtigo\\obtigo\\omnix 5\\obtigo\\trunk\\xagon-etl",
        "C:\\DEV\\omnix\\verint\\fusion-attivio-master@8c6f35a98eb",
        "C:\\DEV\\omnix\\omnix 5\\fusion-etl-configuration\\cfg-api",
        "C:\\visualizer\\nili_project\\nili\\android",
        "C:\\visualizer\\nili_project\\nili\\arduino",
        "C:\\DEV\\omnix\\omnix 4.2\\fusion-analytics-api\\WebintAnalytics_API"
      ]
    }

    const languages = [
      {
        "language": "angular",
        "searchOptions": [
          {
            "regex": "\\s*[^\\.]\\s+__TEXT__\\(",
            "name": "method decleration",
            "findClosure": true
          },
          {
            "regex": "(\\.|\")__TEXT__\\(.*",
            "name": "method usage"
          },
          {
            "regex": "\\.__TEXT__[^(]",
            "name": "variable usage"
          },
          {
            "regex": "\\b__TEXT__\\b",
            "name": "exact"
          },
          {
            "regex": "\\s*((public)?|(private)?)\\s+__TEXT__\\s+=",
            "name": "variable decleration"
          },
          {
            "regex": "\\s*(\"?)__TEXT__(\"?):",
            "name": "json field decleration"
          },
          {
            "regex": "\\s+interface\\s+__TEXT__\\s+",
            "name": "interface"
          }
        ]
      },
      {
        "language": "scala",
        "searchOptions": [
          {
            "regex": "\\s*def\\s+__TEXT__\\s*\\(",
            "name": "method decleration",
            "findClosure": true
          },
          {
            "regex": "\\s*class\\s+__TEXT__\\s*\\(",
            "name": "class decleration",
            "findClosure": true
          },
          {
            "regex": "__TEXT__\\(.*",
            "name": "method usage"
          },
          {
            "regex": "\\.__TEXT__[^(]",
            "name": "variable usage"
          },
          {
            "regex": "\\b__TEXT__\\b",
            "name": "exact"
          },
          {
            "regex": "\\s*((public)?|(private)?)\\s+__TEXT__\\s+=",
            "name": "variable decleration"
          }
        ]
      },
      {
        "language": "java",
        "searchOptions": [
          {
            "regex": "\\s+[a-zA-Z]+\\s+__TEXT__\\(.*\\)",
            "name": "method decleration",
            "findClosure": true
          },
          {
            "regex": "\\s*class\\s+__TEXT__\\s*",
            "name": "class decleration",
            "findClosure": true
          },
          {
            "regex": "((?<![a-zA-Z])\\s|\\.)__TEXT__\\(.*\\)",
            "name": "method usage"
          },
          {
            "regex": "\\.__TEXT__[^(]",
            "name": "variable usage"
          },
          {
            "regex": "\\b__TEXT__\\b",
            "name": "exact"
          },
          {
            "regex": "\\s*((public)?|(private)?)\\s+__TEXT__\\s+=",
            "name": "variable decleration"
          }
        ]
      },
      {
        "language": "ObtigoPipes",
        "searchOptions": [
          {
            "regex": "input\": \"__TEXT__\"",
            "name": "input for pipe",
            "findClosure": true
          },
          {
            "regex": "name\": \"__TEXT__\"",
            "name": "pipe name",
            "findClosure": true
          }
        ]
      },
      {
        "language": "TypeScript/JavaScript",
        "searchOptions": [
          {
            "regex": "\\s*[^\\.]\\s+__TEXT__\\(",
            "name": "method decleration",
            "findClosure": true
          },
          {
            "regex": "(\\.|\")__TEXT__\\(.*",
            "name": "method usage"
          },
          {
            "regex": "\\.__TEXT__[^(]",
            "name": "variable usage"
          },
          {
            "regex": "\\b__TEXT__\\b",
            "name": "exact"
          },
          {
            "regex": "\\s*((public)?|(private)?)\\s+__TEXT__\\s+=",
            "name": "variable decleration"
          },
          {
            "regex": "\\s*(\"?)__TEXT__(\"?):",
            "name": "json field decleration"
          },
          {
            "regex": "\\s+interface\\s+__TEXT__\\s+",
            "name": "interface"
          }
        ]
      }
    ]

    this.http.get('assets/demo_text.txt', { responseType: 'text' })
      .subscribe(data =>
        this.codeEditor.demoText = (data)
      );


    const searchActions = [
      {
        name: "Get File Node",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Get File Node.svg",
        actions:""
      }, {
        name: " Replace Node",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Replace Node.svg",
        actions:""
      }, {
        name: "Search Folder",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Search Folder.svg",
        actions:""
      }, {
        name: "Search File",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Search File.svg",
        actions:""
      }, {
        name: "Search Content",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Search Content.svg",
        actions:""
      }, {
        name: "Create Match",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Create Match.svg",
        actions:""
      }
    ];
    
    const diagramActions = [
      {
        name: "Add File Node",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Add File Node.svg",
        actions:""
      }, {
        name: "Add Comment",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Add Comment.svg",
        actions:""
      }, {
        name: "Add Task",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Add Task.svg",
        actions:""
      }, {
        name: "Add Code node",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Add Code Node.svg",
        actions:""
      }, {
        name: "Link Nodes",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Link Nodes.svg",
        actions:""
      }
    ];
    
    const viewSettings = [
      {
        name: "Show Files",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Show Files.svg",
        actions:""
      }, {
        name: "Show Labels",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Show Labels.svg",
        actions:""
      }, {
        name: "Overlay",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Overlay.svg",
        actions:""
      }, {
        name: "Show Range",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Show Range.svg",
        actions:""
      }, {
        name: "Light Theme",
        icon: "./../assets/icons/svg/CodeChart_Web_Icons__Light Theme.svg",
        actions:""
      },{
        name:"horizantal",
        icon:"./../assets/icons/svg/CodeChart_Web_Icons__Horizontal.svg",
        actions:""
      }
    ];

    this.paths = paths.paths.map(i => {
      return { label: i, value: i };
    });

    this.diagram_actions = diagramActions
    
    this.view_settings = viewSettings

    this.view_actions = searchActions

    this.languageRegexes = languages
    this.selectedLanguageRegexes = this.languageRegexes[0].searchOptions
    this.dropdownLanguageSelection = this.languageRegexes.map(i => { return { value: i.language, label: i.language } })
    this.dropdownLanguageRegexSelection = this.selectedLanguageRegexes.map(i => { return { value: i.name, label: i.name } })


    this.filesInLegend = [{ "fileNodeId": "\\dev19\\etl-experiments\\statefulset.yaml", "color": "#F73C3C", "fileLabel": "\\statefulset.yaml" }, { "fileNodeId": "\\dev19\\etl-experiments\\svc.yaml", "color": "#EEEE08", "fileLabel": "\\svc.yaml" }, { "fileNodeId": "\\dev19\\etl-experiments\\headless-svc.yaml", "color": "#A31AFE", "fileLabel": "\\headless-svc.yaml" }, { "fileNodeId": "\\dev19\\etl-experiments\\configmap.yaml", "color": "#57FE2D", "fileLabel": "\\configmap.yaml" }, { "fileNodeId": "User Created File_1610281545306", "color": "#12CFFE", "fileLabel": "Spark\nworker" }, { "fileNodeId": "User Created File_1610281629560", "color": "#12CFFE", "fileLabel": "Spark Master" }, { "fileNodeId": "User Created File_1611493911787", "color": "#FD9F16", "fileLabel": "spark configuration" }, { "fileNodeId": "User Created File_1611494059082", "color": "#FD9F16", "fileLabel": "worker docker file" }, { "fileNodeId": "dev19\\etl-experiments\\values.yml", "color": "#FD9F16", "fileLabel": "\\values.yml" }, { "fileNodeId": "pom.xml", "color": "#B68D40", "fileLabel": "pom.xml" }]
  }


  public get searchObject(): SearchObject {
    return this._searchJson
  }

  public set searchObject(value: SearchObject) {
    this._searchJson = value;
  }

  set selectedNode(element: Node | Edge) {
    console.log('set selectedNode')
  }

  zoomOnSelected() {
    console.log('zoomOnSelected')
  }


  public setFilerWidth() {
    if (!this.filerFullscreen && !this.chartFullscreen) return '50%'
    if (this.filerFullscreen) return '100%'
    if (this.chartFullscreen) return '0%'
  }

  public setChartWidth() {
    if (!this.filerFullscreen && !this.chartFullscreen) return '50%'
    if (this.chartFullscreen) return '100%'
    if (this.filerFullscreen) return '0%'
  }
  public addFilesToLegend(fileNodes: Node[]) { }

  public removeFilesFromLegend(fileNodes: Node[]) {
    console.log('removeFilesFromLegend')
  }

  public clearFilesInLegend() {
    console.log('clearFilesInLegend')
  }

  public getLegendColors(): string[] {
    console.log('getLegendColors')
    return this.filesInLegend.map((i) => i.color)
  }

  public showHideFile() {
    console.log('showHideFile')
  }

  setSelectedNodesSize(size) {
    console.log('setSelectedNodesSize')
  }

  setSelectedNodesFontSize(size) {
    console.log('setSelectedNodesFontSize')
  }

  setSelectedEdgesDash(isDashed) {
    console.log('setSelectedEdgesDash')
  }
  setSelectedLanguage(value) {
    console.log('SelectedLanguage')
  }
  setSelectedLanguageRegex(value) {
    console.log('SelectedLanguageRegex')
  }
  preventClose(event: MouseEvent) {
    // event.stopPropagation()
    // event.preventDefault()
    // console.log("wc for prevent")
   
  }
 

  setSelectedEdgesSize(size) {
    console.log('setSelectedEdgesSize')
  }

  setSelectedEdgesFontSize(size) {
    console.log('setSelectedEdgesFontSize')
  }

  setEdgePoint(left: boolean, right: boolean) {
    console.log('setEdgePoint')
  }

  public setSelectedEdgesLength(length) {
    console.log('setSelectedEdgesLength')
  }

  public setFileSelection(startLineNumber, endLineNumber) {
    console.log('setFileSelection')
  }

  public performSearch(inputKeyEvent: any) {
    console.log('performSearch')
  }

  public getLinesNumbersText(file: CurrentFile): string {
    console.log('getLinesNumbersText')
    return ''
  }

  public setCurrentFile(fileObject: CurrentFile, callback: () => void) {
    console.log('setCurrentFile')
  }

  public clickedChart(event) {
    console.log('clickedChart')
  }

  public noSelectedNode() {
    console.log('noSelectedNode')
  }

  public createMatchFromSelection(replace = false) {
    console.log('createMatchFromSelection')
  }

  public createFileNode() {
    console.log('createFileNode')
  }

  set markedText(text) {
    console.log('set markedText')
  }

  get markedText() {
    console.log('get markedText')
    return this._markedText
  }

  private doubleClickOnNode(node: IdType, event) {
    console.log('doubleClickOnNode')
  }

  public showStylingElement(x, y, show = true) {
    if (!show) return
    this.showNodeEditBox = true;
    setTimeout(() => {
      let stylePopup = document.getElementById('nodeStylePopup') as HTMLInputElement;

      stylePopup.style.left = x - stylePopup.clientWidth + 'px';
      stylePopup.style.top = y + 'px';
      let textInput = document.getElementById('nodeTitleInput') as HTMLInputElement;
      if (textInput) {
        textInput.focus();
        textInput.select();
      }
    }, 50)
  }
  get selectedNode(): Node | Edge {
    return null;
  }

  public recalulateRectangles = true
  public selectionPreDrag: { nodes: IdType[]; edges: IdType[] } = {
    nodes: [],
    edges: [],
  }
  public setChartEvents() {
    console.log('setChartEvents')
  }

  public drawnRectangles: { rectX; rectY; rectH; rectW; color }[] = []
  public setRectangleAroundFile_new() {
    console.log('setRectangleAroundFile_new')
  }
  types= [
    {
        "id": "1",
        "value": "Type 1"
    },
    {
         "id": "2",
         "value": "Type 2"
    },
    {
          "id": "3",
          "value": "Type 3"
    }];

  ngOnInit(): void {
    console.log('ngOnInit')
    const defaultUser = new User('1', 'User 1', '111 Lane St')

    this.users.push(defaultUser)
    this.users.push(new User('2', 'User 2', '222 Lane St'))
    this.users.push(new User('3', 'User 3', '333 Lane St'))
    this.users.push(new User('4', 'User 4', '444 Lane St'))

    this.selectedUser = defaultUser
  }

  public codeSelectionChange(event: Ace.Selection) {
    console.log('codeSelectionChange')
  }

  public messageBoxQueue: messageBoxItem[] = []

  public addMessage(title: string, message, displayTime) {
    console.log('addMessage')
  }

  public displayNextMessage() {
    console.log('displayNextMessage')
  }

  public clearChart() {
    console.log('clearChart')
  }

  public createShape(shape: any) {
    console.log('createShape')
  }

  public setTitle(event: Event) {
    console.log('setTitle')
  }

  public _setSelecteionColor(color) {
    console.log('_setSelecteionColor')
  }

  public setSelectionNodeStyle(style: { background; border }) {
    console.log('setSelectionNodeStyle')
  }

  public setSelectionEdgeStyle(style: { background; border }) {
    console.log('setSelectionEdgeStyle')
  }

  public _setSelecteionBorderColor(color) {
    console.log('_setSelecteionBorderColor')
  }

  public setSelectionIcon(icon) {
    console.log('setSelectionIcon')
  }

  public setSelectionImage(imagePath) {
    console.log('setSelectionImage')
  }

  public setSelectionShape(shape) {
    console.log('setSelectionShape')
  }

  public undo() {
    console.log('undo')
  }

  public linkNodes(linkStyle) {
    console.log('linkNodes')
  }

  public reload() {
    console.log('reload')
  }

  public clearVisiIds() {
    console.log('clearVisiIds')
  }

  public rewriteVisiIds() {
    console.log('rewriteVisiIds')
  }

  public fullSaveToFile() {
    console.log('fullSaveToFile')
  }

  public jsonSave() {
    console.log('jsonSave')
  }

  public async dbSave(isNew: boolean = true) {
    console.log('dbSave')
  }

  public clear() {
    console.log('clear')
  }

  public resetDiagramDetails() {
    console.log('resetDiagramDetails')
  }

  onSelectLoadTable(event) {
    console.log('onSelectLoadTable')
  }

  onLoadTableFilter(event) {
    console.log('onLoadTableFilter')
  }

  public performSavedSearch(search: SearchOptions) {
    console.log('performSavedSearch')
  }

  pathDropdownClick(event: Event) {
    console.log('pathDropdownClick')
  }

  setSelectedPath(pathValue: string) {
    console.log('setSelectedPath')
  }

  private regexs = [
    { remark: 'add /s as regex option so . catptures new line as well' },
    {
      title: 'get all functions location',
      regex: '(public|private) (.+)(.+).*{',
    },
    {
      title: 'get specific function location',
      regex: '(public|private)s*(__functionName___)(.+).*{',
      example: '(public|private)s*(isIdNode)(.+).*{',
    },
    {
      title: 'get specific function content',
      regex: '(public|private)s*(__functionName___)(.+).*{',
      example: '(public|private)s*(isIdNode)(.+).*{',
    },
  ]
  allMatchesSelected: boolean = false
  allNodeImages: { path; name }[] = allNodeIconImages
  nodeShapes: { faClass; visShape }[] = NodeShapes

  public set codeFontSize(fontSize) {
    console.log('set codeFontSize')
  }

  public get fontSize() {
    console.log('get fontSize')
    return localStorage.getItem('codeFontSize')
  }

  public filterAvailableFiles(value) {
    console.log('filterAvailableFiles')
  }

  openFile(fullPath: any) {
    console.log('openFile')
  }

  focusOnFileOpenInput() {
    console.log('focusOnFileOpenInput')
  }

  setCustomPath(event: KeyboardEvent) {
    console.log('setCustomPath')
  }

  selectfileMatches(value, fileResults: FindInFilesResponse) {
    console.log('selectfileMatches')
  }

  selectMatch(value, match: MatchInfo, fileResults: FindInFilesResponse) {
    console.log('selectMatch')
  }

  loadFindResults() {
    console.log('loadFindResults')
  }

  public loadFromFile(event) {
    console.log('loadFromFile')
  }

  showFindResultsDialog(response: FindInFilesResponse[], callback) {
    console.log('showFindResultsDialog')
  }

  setAllMatchesSelected(isSelected) {
    console.log('setAllMatchesSelected')
  }

  toggleSelectAllMatches() {
    console.log('toggleSelectAllMatches')
  }

  selectSearchResultForDisplay(
    fileResult: FindInFilesResponse,
    match: MatchInfo
  ) {
    console.log('selectSearchResultForDisplay')
  }

  fitAllNodesOnScreen() {
    console.log('fitAllNodesOnScreen')
  }

  reloadFromCode() {
    console.log('reloadFromCode')
  }

  clearFailedReloaded() {
    console.log('clearFailedReloaded')
  }
  onUserChange(event) {
    console.log('onUserChange', event.target.value)
  }
}




export class User {
  id: string;
  name: string;
  address: string;

  constructor(id, name, address) {
    this.id = id,
    this.name = name;
    this.address = address;
  }
}
