///aaaa///
import { AutoComplete, DataTableModule } from 'primeng/primeng'
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core'
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
    
    this.paths = paths.paths.map(i => {
      return { label: i, value: i };
    });

    this.languageRegexes = languages
    this.selectedLanguageRegexes = this.languageRegexes[0].searchOptions
    this.dropdownLanguageSelection = this.languageRegexes.map(i => { return { value: i.language, label: i.language } })
    this.dropdownLanguageRegexSelection = this.selectedLanguageRegexes.map(i => { return { value: i.name, label: i.name } })


    this.filesInLegend = [{"fileNodeId":"\\dev19\\etl-experiments\\statefulset.yaml","color":"#F73C3C","fileLabel":"\\statefulset.yaml"},{"fileNodeId":"\\dev19\\etl-experiments\\svc.yaml","color":"#EEEE08","fileLabel":"\\svc.yaml"},{"fileNodeId":"\\dev19\\etl-experiments\\headless-svc.yaml","color":"#A31AFE","fileLabel":"\\headless-svc.yaml"},{"fileNodeId":"\\dev19\\etl-experiments\\configmap.yaml","color":"#57FE2D","fileLabel":"\\configmap.yaml"},{"fileNodeId":"User Created File_1610281545306","color":"#12CFFE","fileLabel":"Spark\nworker"},{"fileNodeId":"User Created File_1610281629560","color":"#12CFFE","fileLabel":"Spark Master"},{"fileNodeId":"User Created File_1611493911787","color":"#FD9F16","fileLabel":"spark configuration"},{"fileNodeId":"User Created File_1611494059082","color":"#FD9F16","fileLabel":"worker docker file"},{"fileNodeId":"dev19\\etl-experiments\\values.yml","color":"#FD9F16","fileLabel":"\\values.yml"},{"fileNodeId":"pom.xml","color":"#B68D40","fileLabel":"pom.xml"}]
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
    setSelectedLanguage(value){
      console.log('SelectedLanguage')
    }
    setSelectedLanguageRegex(value){
      console.log('SelectedLanguageRegex')
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

    ngOnInit(): void {
        console.log('ngOnInit')
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
}
