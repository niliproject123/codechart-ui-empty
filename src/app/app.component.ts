///aaaa///
import { AutoComplete, DataTableModule, Dropdown } from 'primeng/primeng'
import { Component, OnInit, AfterViewInit, ViewChild, HostListener } from '@angular/core'
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
import { ThemeService } from "./theme/theme.service";

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
  id: string
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
    id: "-1",
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

  public lastDiagramLoaded: string = '';
  
  view_settings = [];
  view_actions = [];
  diagram_actions = [];
  users = []
  selectedUser: User = null;
  
  options = {};
  public objects = [];
 
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
    public saveLoadService: SaveLoadService,
    private themeService: ThemeService
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

    this.availableFiles = ["C:\\visualizer\\visualizer-node\\node\\src\\App.ts", "C:\\visualizer\\visualizer-node\\node\\src\\config.ts", "C:\\visualizer\\visualizer-node\\node\\src\\index.ts", "C:\\visualizer\\visualizer-node\\node\\src\\LocalRepo.ts", "C:\\visualizer\\visualizer-node\\node\\src\\SaveWrapper.ts", "C:\\visualizer\\visualizer-node\\node\\src\\update_data_nov_2019_etl_step1.json", "C:\\visualizer\\visualizer-node\\node\\src\\VisiInCode.ts"]
   
    this.objects = [
      {
      id: 1,
      name: 'C:',
      children: [
        {
           id: 2, 
           name: 'visualizer',
           children: [
             {
               id:3,
               name:'visualizer-node',
               children:[{
                 id:4,
                 name:'node',
                 children:[
                   {
                     id:5,
                     name:'src',
                     children:[
                       {
                        id:6,
                        name:'App.ts',
                       },{
                         id:7,
                         name:'config.ts'
                       },{
                         id:8,
                         name:'index.ts'
                       },{
                        id:9,
                        name:'LocalRepo.ts'
                       },{
                        id:10,
                        name:'SaveWrapper.ts'
                       },{
                        id:11,
                        name:'update_data_nov_2019_etl_step1.json'
                       },{
                        id:12,
                        name:'VisiInCode.ts'
                       }
                 ]
                }
                
               ]
             }
           ]
      }
       
      ]
    }
  ]
}
];
   
  
    const searchActions = [
      {
        name: "Get File Node",
        icon: "./../assets/icons/dark/Dark Theme Icons__Get File Node.png",
        actions: ""
      }, {
        name: " Replace Node",
        icon: "./../assets/icons/dark/Dark Theme Icons__Replace Node.png",
        actions: ""
      }, {
        name: "Search Folder",
        icon: "./../assets/icons/dark/Dark Theme Icons__Search Folder.png",
        actions: ""
      }, {
        name: "Search File",
        icon: "./../assets/icons/dark/Dark Theme Icons__Search File.png",
        actions: ""
      }, {
        name: "Search Content",
        icon: "./../assets/icons/dark/Dark Theme Icons__Search Content.png",
        actions: ""
      }, {
        name: "Create Match",
        icon: "./../assets/icons/dark/Dark Theme Icons__Create Match.png",
        actions: ""
      }
    ];

    const diagramActions = [
      {
        name: "Add File Node",
        icon: "./../assets/icons/dark/Dark Theme Icons__Add File Node.png",
        actions: ""
      }, {
        name: "Add Comment",
        icon: "./../assets/icons/dark/Dark Theme Icons__Add Comment.png",
        actions: ""
      }, {
        name: "Add Task",
        icon: "./../assets/icons/dark/Dark Theme Icons__Add Task.png",
        actions: ""
      }, {
        name: "Add Code node",
        icon: "./../assets/icons/dark/Dark Theme Icons__Add Code Node.png",
        actions: ""
      }, {
        name: "Link Nodes",
        icon: "./../assets/icons/dark/Dark Theme Icons__Link Nodes.png",
        actions: ""
      }
    ];

    const viewSettings = [
      {
        name: "Show Files",
        icon: "./../assets/icons/dark//Dark Theme Icons__Show Files.png",
        actions: ""
      }, {
        name: "Show Labels",
        icon: "./../assets/icons/dark/Dark Theme Icons__Show Labels.png",
        actions: ""
      }, {
        name: "Overlay",
        icon: "./../assets/icons/dark/Dark Theme Icons__Overlay.png",
        actions: ""
      }, {
        name: "Show Range",
        icon: "./../assets/icons/dark/Dark Theme Icons__Show Range.png",
        actions: ""
      }, {
        name: "Light Theme",
        icon: "./../assets/icons/dark/Dark Theme Icons__Light Theme.png",
        actions: ""
      }, {
        name: "horizantal",
        icon: "./../assets/icons/dark/Dark Theme Icons__Horizontal.png",
        actions: ""
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

    this.diagramsList = demoDiagramData

  }
  onEvent(event:any){
      if (event && event.target && event.target.childNodes[0]) {
          this.openFileVisible = false;
    
          console.log(event.target.childNodes[0].data)
      }
  
  }
 setcolor(i){
   if(i == this.filesInLegend.length -1)
   {
    const style = {'background':'linear-gradient('+this.filesInLegend[i].color+', '+this.filesInLegend[i - 1].color+')','width':'auto'};
    return style;
  
     
   }
   else if(i == 0){
    const style = {'background':'linear-gradient('+this.filesInLegend[i+1].color+', '+this.filesInLegend[i].color+')','width':'auto'};
    return style;
  
   }
   else{
    const style = {'background':'linear-gradient('+this.filesInLegend[i+1].color+', '+this.filesInLegend[i - 1].color+')','width':'auto'};
    return style;
  
   }

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

  public loadDiagramsTable() {
    this.showDiagramsLoadTable = true
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
  types = [
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
  
  }
  toggleTheme() {
    if (this.themeService.isDarkTheme()) {
      this.themeService.setLightTheme();
    } else {
      this.themeService.setDarkTheme();
    }

  }

  public codeSelectionChange(event: Ace.Selection) {
    console.log('codeSelectionChange')
  }

  public messageBoxQueue: messageBoxItem[] = [

    {
      title:"Error",
      displayTime:0,
      "message":"The thing did not work so try something else"
    }
  ]

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
  ClickSearchActionsItem(value: string) {
    if(value == "Get File Node"){
      this.openFileVisible = true
        
    }
    if(value == "Light Theme"){
       this.toggleTheme();
    }
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
    this.openFileSuggestions = this.availableFiles
      .filter(i => i.toLowerCase().indexOf(value.toLowerCase()) !== -1)
      .sort((a, b) => {
        const split = value.split('.');
        if (split.length > 1) {
          const filename = split[split.length - 1];
          if (filename.startsWith(value)) return 1;
          else return -1;
        } else return 0;
      });
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

const demoDiagramData = [
  {
    "id": "LrvAS2984tLivAzZ",
    "story": "analytics search in attivio",
    "labels": [
      "\\AttivioResponseDTO.java",
      "\\AttivioResponseDTO.java",
      "\\AttivioResponseDTO.java",
      "\\AttivioResponseDTO.java",
      "\\AttivioResponseDTO.java",
      "\\AttivioResponseDTO.java",
      "totalTime",
      "\\AttivioResponseDTO.java",
      "AttivioResponseDTO",
      "\\WebintSearchService.java",
      "\\WebintSearchService.java",
      "\\WebintSearchService.java",
      "\\WebintSearchService.java",
      "search endpoint",
      "\\AttivioApi.java",
      "\\AttivioApi.java",
      "\\AttivioApi.java",
      "search api",
      "\\WebintSearchService.java",
      "\\AttivioApi.java",
      "\\AttivioApi.java",
      "excecute search",
      "\\AttivioApi.java",
      "\\AttivioApi.java",
      "\\AttivioApi.java",
      "\\AttivioApi.java",
      "log attivio request",
      "\\AttivioApi.java",
      "logging format",
      "\\AttivioApi.java",
      "actuall execution \nof query"
    ],
    "fileNames": [
      "\\AttivioResponseDTO.java",
      "\\WebintSearchService.java",
      "\\AttivioApi.java"
    ],
    "projectList": [
      "C:\\DEV\\omnix\\omnix 4.2\\fusion-analytics-api\\WebintAnalytics_API"
    ],
    "createdAt": "2021-03-31T13:02:41.525Z",
    "updatedAt": "2021-03-31T13:02:41.525Z"
  },
  {
    "id": "RjiIjzyiNJx8xeX7",
    "projectList": [],
    "story": "etl monitor and retry",
    "labels": [
      "batches",
      "config db",
      "properties",
      "retries",
      "\\RestServer.ts",
      "\\RestServer.ts",
      "\\MonitoringQueries.ts",
      "\\retry.controller.js",
      "\\retry.service.js",
      "\\retry.service.js",
      "\\retry.service.js",
      "\\retry.controller.js",
      "\\retry.controller.js",
      "\\retry.service.js",
      "\\retry.service.js",
      "\\retry.controller.js",
      "\\retry.service.js",
      "\\JobService.scala",
      "\\JobService.scala",
      "\\JobService.scala",
      "\\JobService.scala",
      "\\MasterConnector.scala",
      "\\MasterConnector.scala",
      "\\MasterComponent.scala",
      "\\MasterComponent.scala",
      "\\JdbcConnector.scala",
      "\\JdbcConnector.scala",
      "\\MasterConnector.scala",
      "\\MasterConnector.scala",
      "\\MasterConnector.scala",
      "monitor api",
      "config api",
      "ETL",
      "\\MasterComponent.scala",
      "\\MasterComponent.scala",
      "\\MasterComponent.scala",
      "KAFKA",
      "\\MonitorKafka.ts",
      "\\MonitorKafka.ts",
      "\\retry.service.js",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "error processing in transformers",
      "retry \ncomponents",
      "REST",
      "incremental connectors"
    ],
    "fileNames": [
      "\\RestServer.ts",
      "\\MonitoringQueries.ts",
      "\\retry.controller.js",
      "\\retry.service.js",
      "\\JobService.scala",
      "\\MasterConnector.scala",
      "\\MasterComponent.scala",
      "\\JdbcConnector.scala",
      "monitor api",
      "config api",
      "ETL",
      "\\MonitorKafka.ts",
      "error processing in transformers"
    ],
    "createdAt": "2021-03-29T19:43:11.499Z",
    "updatedAt": "2021-03-29T19:43:11.499Z"
  },
  {
    "id": "265ubFCpsoPT3upG",
    "projectList": [],
    "story": "etl execution",
    "labels": [
      "\\JobService.scala",
      "\\JobService.scala",
      "load etl jobs from config api",
      "\\JobService.scala",
      "execute jobs",
      "\\JobService.scala",
      "create connectors \nfor setting retry",
      "\\JobService.scala",
      "\\JobService.scala",
      "create workflow \nfrom json",
      "\\Ingestion.scala",
      "\\Ingestion.scala",
      "Ingestion",
      "\\Ingestion.scala",
      "\\Pipe.scala",
      "\\Pipe.scala",
      "Pipe",
      "\\OmnixIngestionService.scala",
      "\\ExecutePipeline.scala",
      "\\ExecutePipeline.scala",
      "def\nstartIngestion",
      "\\ExecutePipeline.scala",
      "\"init\" df",
      "\\ExecutePipeline.scala",
      "\\Pipe.scala",
      "\\ExecutePipeline.scala",
      "create pipeline pool of\npipe -> pipeline",
      "\\ExecutePipeline.scala",
      "\\ExecutePipeline.scala",
      "def\nexecute\npipe line",
      "\\ExecutePipeline.scala",
      "yes",
      "\\ExecutePipeline.scala",
      "no",
      "\\ExecutePipeline.scala",
      "pipe result \nexists in loaded",
      "\\ExecutePipeline.scala",
      "for each dependency\nincluding incoming DF\ncheck if not exists in loaded\nperform execute()\nto add result to loaded",
      "dependecies are the DFs this\n pipe needs in order to run\nactually results of pipes",
      "\\ExecutePipeline.scala",
      "perform pipeline\nadd result to loaded",
      "loaded = \nmap of pipes results",
      "\\ExecutePipeline.scala",
      "set spark session",
      "\\ExecutePipeline.scala",
      "create empty df",
      "\\cellebrite_etl_file_flow.json",
      "\\cellebrite_etl_file_flow.json",
      "all jobs start \nwith \"init\"\ndf",
      "\\OmnixIngestionService.scala",
      "\\OmnixIngestionService.scala",
      "\\OmnixIngestionService.scala",
      "\\ExecutePipeline.scala",
      "\\ExecutePipeline.scala",
      "\\ExecutePipeline.scala",
      "create pipes` stages (processors)\nfrom transformer configs"
    ],
    "fileNames": [
      "\\JobService.scala",
      "\\Ingestion.scala",
      "\\Pipe.scala",
      "\\OmnixIngestionService.scala",
      "\\ExecutePipeline.scala",
      "\\cellebrite_etl_file_flow.json"
    ],
    "createdAt": "2021-03-21T20:41:51.526Z",
    "updatedAt": "2021-03-21T20:49:43.471Z"
  },
  {
    "id": "1O7HQNpYBXV6xTNf",
    "projectList": [],
    "story": "rdbs validation",
    "labels": [
      "\\AttivioDocValidator.java",
      "\\AttivioDocValidator.java",
      "\\DDMCacheListener.java",
      "\\DDMCacheListener.java",
      "update ddm",
      "\\AttivioDocValidator.java",
      "validate fields",
      "\\ValidFieldsValidator.java",
      "\\ValidFieldsValidator.java",
      "\\AttivioDocValidator.java",
      "\\AttivioDocValidator.java",
      "validate closed lists",
      "\\ClosedListFieldValidator.java",
      "\\ClosedListFieldValidator.java",
      "\\DdmProvider.java",
      "\\DdmProvider.java",
      "\\DdmProvider.java",
      "\\DdmRequester.java",
      "\\DdmRequester.java",
      "\\DdmRequester.java",
      "build ddm from json"
    ],
    "fileNames": [
      "\\AttivioDocValidator.java",
      "\\DDMCacheListener.java",
      "\\ValidFieldsValidator.java",
      "\\ClosedListFieldValidator.java",
      "\\DdmProvider.java",
      "\\DdmRequester.java"
    ],
    "createdAt": "2021-03-21T16:03:12.984Z",
    "updatedAt": "2021-03-21T16:20:47.627Z"
  },
  {
    "id": "gpQh5yRvg1JBtMDU",
    "projectList": [],
    "story": "ETL monitor api monitoring queries",
    "description": "ETL monitoring queries and endpoints",
    "labels": [
      "\\RestServer.ts",
      "\\RestServer.ts",
      "\\RestServer.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\RestServer.ts",
      "\\RestServer.ts",
      "\\RestServer.ts",
      "\\RestServer.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\RestServer.ts",
      "\\RestServer.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\RestServer.ts",
      "\\RestServer.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\MonitoringQueries.ts",
      "\\RestServer.ts"
    ],
    "fileNames": [
      "\\RestServer.ts",
      "\\MonitoringQueries.ts"
    ],
    "createdAt": "2021-03-17T21:02:36.554Z",
    "updatedAt": "2021-03-17T21:02:36.554Z"
  },
  {
    "id": "7fDkmN1XtfZxqU9y",
    "projectList": [],
    "story": "Arduino loop",
    "createdAt": "2021-02-14T15:25:48.399Z",
    "updatedAt": "2021-03-16T20:39:35.692Z",
    "fileNames": [
      "\\nili_arduino.ino",
      "\\Operator.java"
    ],
    "labels": [
      "\\nili_arduino.ino",
      "infinite loop",
      "\\nili_arduino.ino",
      "read incoming \nstring from Arduino",
      "\\nili_arduino.ino",
      "light leds",
      "\\nili_arduino.ino",
      "get switches",
      "\\nili_arduino.ino",
      "send switches to \nArduino",
      "\\nili_arduino.ino",
      "calculate location",
      "\\nili_arduino.ino",
      "on + off leds by \ncolor",
      "\\nili_arduino.ino",
      "* Arduino runs on grid of leds, lighting a led for an instant.\n then runs on switches getting press.\n\n* input LED string and \nr06g12...\nwhere furst char is color, second is positon\n\n* output  press string is [row,col]..\n",
      "\\Operator.java"
    ]
  },
  {
    "id": "6RLvS7bKt9quIYlO",
    "projectList": [],
    "story": "lights on off",
    "description": "pressing on screen turns lights on or off\nblue tooth communication",
    "labels": [
      "\\activity_main.xml",
      "\\MainActivity.java",
      "\\ConnectionManager.java",
      "\\Timer.java",
      "\\activity_main.xml",
      "button decleration",
      "\\activity_main.xml",
      "\\MainActivity.java",
      "\\MainActivity.java",
      "\\MainActivity.java",
      "\\MainActivity.java",
      "lights on",
      "\\ConnectionManager.java",
      "send last lights string\nto arduino",
      "\\MainActivity.java",
      "lights off",
      "\\ConnectionManager.java",
      "send empty \nlights string"
    ],
    "fileNames": [
      "\\activity_main.xml",
      "\\MainActivity.java",
      "\\ConnectionManager.java",
      "\\Timer.java"
    ],
    "createdAt": "2021-02-14T16:07:58.550Z",
    "updatedAt": "2021-03-12T08:05:14.322Z"
  },
  {
    "id": "sKXQ2pKZ8S2IVB5K",
    "projectList": [],
    "story": "cached index",
    "description": "index wrapper",
    "labels": [
      "\\application.properties",
      "\\application.properties",
      "name of cache index",
      "\\ElasticConfiguration.java",
      "\\ElasticConfiguration.java",
      "\\ElasticConfiguration.java",
      "\\EntityCacheApi.java",
      "\\EntityCacheApi.java",
      "\\EntityCacheApi.java",
      "\\EntityCacheApi.java",
      "\\ElasticConfiguration.java",
      "\\ElasticConfiguration.java",
      "get cached index name",
      "set cahced index name",
      "\\EntityCacheApi.java",
      "\\EntityCacheService.java",
      "\\EntityCacheService.java",
      "delete cache endpoint",
      "\\EntityCacheApi.java",
      "\\EntityCacheCleanupScheduler.java",
      "\\EntityCacheCleanupScheduler.java",
      "scheduled clean up",
      "\\EntityCacheApi.java",
      "\\EntityCacheService.java",
      "\\EntityCacheService.java",
      "delete by ID enspoint"
    ],
    "fileNames": [
      "\\application.properties",
      "\\ElasticConfiguration.java",
      "\\EntityCacheApi.java",
      "\\EntityCacheService.java",
      "\\EntityCacheCleanupScheduler.java"
    ],
    "createdAt": "2021-03-08T13:16:09.317Z",
    "updatedAt": "2021-03-08T13:16:09.317Z"
  },
  {
    "id": "2qwWyKBQVVHnolMC",
    "projectList": [],
    "story": "cc git design 1",
    "labels": [
      "configs.json",
      "login to git",
      "get info from manager\npath of repo on local disk",
      "in memory user credentials\ngit, cc user",
      "users DB\ncc organization name\ngit user name\nrepo",
      "code folders",
      "folder per organiztion",
      "folder per repo",
      "folder per branch",
      "git",
      "git actions checkout / pull",
      "git manager module",
      "checkout / pull",
      "get project folder",
      "git manager module",
      "diagram manager module\n",
      "diagram actions",
      "diagram actions",
      "diagram db\nadd users/organizations",
      "online users login using organization (which sets main folder) and git user (which is same as cc user).",
      "diagrams per user",
      "online using git",
      "online without git",
      "server: ui, git manager, diagram manager, agent, code folder,",
      "users login using cc user, organization",
      "on server: ui, diagram manager, \non local machine: code folder, agent",
      "all local",
      "everything is local, with one user and organization: \"local\"",
      "3 modes of operation set in API",
      "only available on \"git\" mode",
      "agent module",
      "search actions\nsave/reload code",
      "search actions/\nsave/reload code",
      "\\App.ts",
      "\\App.ts",
      "411-440:private async createDiagram(re...",
      "\\App.ts",
      "611-1020:private processDir(dir: string...",
      "\\App.ts",
      "diagram manager module\n",
      "agent module",
      "\\LocalRepo.ts",
      "LocalRepo",
      "App.ts",
      "API",
      "UI",
      "user selects local/online mode.\nin future we can set this to on premise location",
      "\\SaveLoadService.ts",
      "\\SaveLoadService.ts",
      "SaveLoadService",
      "\\search.actions.ts",
      "SearchActions"
    ],
    "fileNames": [
      "code folders",
      "folder per organiztion",
      "folder per repo",
      "folder per branch",
      "git manager module",
      "diagram manager module\n(SaveWrapper)",
      "agent module",
      "\\App.ts",
      "\\LocalRepo.ts",
      "\\SaveLoadService.ts",
      "\\search.actions.ts"
    ],
    "createdAt": "2021-02-25T16:59:21.810Z",
    "updatedAt": "2021-02-27T20:11:44.546Z"
  },
  {
    "id": "8YdBMSio0JqPJr6y",
    "projectList": [],
    "story": "play pause",
    "description": "nili\npressing on screen plays/pauses song",
    "labels": [
      "\\activity_main.xml",
      "\\MainActivity.java",
      "\\ConnectionManager.java",
      "\\activity_main.xml",
      "button decleration",
      "\\activity_main.xml",
      "\\MainActivity.java",
      "toggle play/pause",
      "\\MainActivity.java",
      "\\MainActivity.java",
      "\\MainActivity.java",
      "\\MainActivity.java",
      "set is paused",
      "\\MainActivity.java",
      "\\Timer.java",
      "\\Timer.java",
      "set is paused in timer"
    ],
    "fileNames": [
      "\\activity_main.xml",
      "\\MainActivity.java",
      "\\ConnectionManager.java",
      "\\Timer.java"
    ],
    "createdAt": "2021-02-14T16:07:58.550Z",
    "updatedAt": "2021-02-22T09:01:00.711Z"
  },
  {
    "id": "WH6Z4VJnAJCmehMn",
    "projectList": [],
    "story": "floating menu",
    "description": "obtigo ui",
    "labels": [
      "\\floating-menu-button.component.ts",
      "\\floating-menu-button.component.scss",
      "\\floating-menu-button.component.html",
      "\\_overlay.scss",
      "\\_overlay.scss",
      "\\floating-menu-button.component.html",
      "\\floating-menu-button.component.ts",
      "\\basic-full-query.component.html",
      "\\basic-full-query.component.html",
      "\\basic-full-query.component.html",
      "\\basic-full-query.component.ts",
      "\\basic-full-query.component.ts"
    ],
    "fileNames": [
      "\\floating-menu-button.component.ts",
      "\\floating-menu-button.component.scss",
      "\\floating-menu-button.component.html",
      "\\_overlay.scss",
      "\\basic-full-query.component.html",
      "\\basic-full-query.component.ts"
    ],
    "createdAt": "2021-02-20T21:25:19.648Z",
    "updatedAt": "2021-02-20T21:25:19.648Z"
  },
  {
    "id": "7GqIPlXnA3f6o9k8",
    "projectList": [],
    "story": "rectangle draw",
    "description": "code chart",
    "labels": [
      "app.component.ts",
      "app.component.ts",
      "app.component.ts",
      "app.component.ts",
      "app.component.ts"
    ],
    "fileNames": [
      "app.component.ts"
    ],
    "createdAt": "2021-02-19T21:43:36.438Z",
    "updatedAt": "2021-02-19T21:43:36.438Z"
  },
  {
    "id": "k7SiZ2kWMtg0BCHa",
    "projectList": [],
    "story": "reload code",
    "description": "code chart",
    "labels": [
      "app.component.html",
      "app.component.html",
      "click on reload button",
      "app.component.ts",
      "app.component.ts",
      "app.component.ts",
      "\\save.load.ts",
      "\\save.load.ts",
      "\\save.load.ts",
      "\\chart.actions.ts",
      "\\chart.actions.ts",
      "\\chart.actions.ts",
      "\\chart.actions.ts",
      "reload a single file\nreturn updated nodes and \nfailed reload match nodes as '!' nodes",
      "\\chart.actions.ts",
      "creates a '!' node to (be displayed_\nconnected to match node",
      "\\chart.actions.ts",
      "sorts match by line number\nwith offsets",
      "\\chart.actions.ts",
      "save new offsets for matches\n-we move along line numbers in original and new file content\n-increasing/decreasing offsets according to diff\n- when reaching a node with line number that matches the new line offset we update the offset array",
      "\\chart.actions.ts",
      "update match nodes with new offsets",
      "\\chart.actions.ts",
      "add '!' nodes to nodes in which text after \ndiff doesn`t match new text",
      "\\chart.actions.ts",
      "indexes (line numbers)\nfor original content\nand new content",
      "\\chart.actions.ts",
      "get line numbers\nstart line number, end line number, in content line number"
    ],
    "fileNames": [
      "app.component.html",
      "app.component.ts",
      "\\save.load.ts",
      "\\chart.actions.ts"
    ],
    "createdAt": "2021-02-19T16:27:15.460Z",
    "updatedAt": "2021-02-19T16:27:15.460Z"
  }
]
