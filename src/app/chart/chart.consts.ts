export type ContentEdgeTypes_type = 'inside content' | 'inside selection'

export class ContentEdgeTypes {
  static insideContent: ContentEdgeTypes_type = 'inside content';
  static insideSelection: ContentEdgeTypes_type = 'inside selection';
}

export const ChartStyle = {
  height: '100%',
  physics: {
    enabled: true
  },
  interaction: {
    dragNodes: true,
    dragView: true,
    hideEdgesOnDrag: false,
    hideNodesOnDrag: false,
    hover: true,
    keyboard: {
      enabled: false,
      speed: { x: 10, y: 10, zoom: 0.02 },
      bindToWindow: false
    },
    multiselect: true,
    navigationButtons: true,
    selectable: true,
    selectConnectedEdges: false,
    zoomView: true
  },
  manipulation: {
    enabled: false,
    initiallyActive: false,
    addNode: true,
    addEdge: true,
    editEdge: true,
    deleteNode: true,
    deleteEdge: true,
    controlNodeStyle: {
      // all node options are valid.
    }
  }

};

export const ChartConsts = {
  maxTitleLength: 30,
  filePositions: { maxInRow: 3, distance: 700 },
  fileDistance: { x: 0, y: 400 },
  timeForFixingNodes: 2000,
  dimColor: '#787878',
  chartStyle: ChartStyle,
  gridBaseSize: 50,
  matchDistance: { toPreviousMatch: 6, betweenMatches: 2 },

  FileNameDistance: 1000
};

export const MatchDistance = {
  betweenMatches: () => { return ChartConsts.matchDistance.betweenMatches * ChartConsts.gridBaseSize },
  toPreviousMatch: () => { return ChartConsts.matchDistance.toPreviousMatch * ChartConsts.gridBaseSize },
}

export const chosenFunc = {
  node: (values, id, selected, hovering) => {
    values.shadowSize = 20;
    values.size = values.size * 1.5
    values.borderSize = 10
    values.color = 'white'
  }
}

export const ChartStyles = {
  baseNode: {
    physics: false,
    shape: 'box',
    widthConstraint: { minimum: 50, maximum: 800 },
    font: { align: 'left' },
    chosen: chosenFunc,
    borderWidth: 3
  },
  startNode: { d: {} },
  lockedNode: {},
  insideContentLink: {
    d: { type: ContentEdgeTypes.insideContent },
    arrows: { to: true },
    width: 40,
    color: { color: 'rgb(255, 255, 0)', opacity: 0.3 }
  },
  insideSelectionLink: {
    d: { type: ContentEdgeTypes.insideSelection },
    arrows: { to: true },
    width: 20,
    color: { color: 'rgb(255, 0, 0)', opacity: 0.3 }
  },
  baseLink: {
    type: 'link', d: {}, width: 5, chosen: {
      edge: (values, id, selected, hovering) => {
        values.shadow = true, values.width = values.width * 1.5;
      }
    }, physics: false, length: 0, smooth: false, color: {inherit: false}
    // "smooth": {
    //   "type": "cubicBezier",
    //   "forceDirection": "horizontal",
    //   "roundness": 1
    // }
  },
  searchNode: {
    font: { background: 'white', size: 40, align: 'left', strokeWidth: 1 },
    shape: 'circularImage',
    image: '/assets/nodes/coding.svg',
    imagePadding: 20
  },
  gotoNode: { image: '/assets/nodes/push-pin.svg',  size: 20, shape: 'circularImage'},
  matchMatchLink: { arrows: { to: { enabled: true } }, width: 5 },
  dimmedLink: { width: 0.2 },
  dimmedNode: { color: { background: 'white' }, border: { color: 'white' }, font: { color: 'grey' } },
  fileNode: {
    color: { border: '#ffffff', background: '#ffffff' },
    font: { size: 40, align: 'left', strokeWidth: 1, background: 'white' },
    size: 100,
    scaling: { label: true },
    physics: false,
    widthConstraint: { minimum: 50, maximum: 500 },
    shape: 'image', image: '/assets/nodes/file.svg', imagePadding: 20
  },
  fileLink: { dashes: true, width: 0.2, hidden: true, d: { type: 'ofFile' } },
  suspectedSameMatchLink: { dashes: [2, 12], d: {type: 'suspectedSameMatch'} },
  nodesTypes: [{
    name: 'remark',
    details: {
      node: { color: {
        background: '#B7EFFE',
        border: '#12CFFE'
      }, d: { type: 'remark', isCustom: true }, font: { size: 30, align: 'left' } },
      link: { dashes: false, arrows: { to: { enabled: false } }, color: { inherit: 'to' }, length: 100 },
      tooltip: 'add remark node',
      class: 'fa fa-commenting-o',
      createLinkToFile: false
    }
  },
  {
    name: 'task',
    details: {
      node: { color: {
        background: '#FFBCB6',
        border: '#F73C3C'
      }, d: { type: 'task', isCustom: true }, font: { size: 70, align: 'left' } },
      link: { dashes: false, arrows: { to: { enabled: false } }, color: { inherit: 'to' }, length: 100 },
      tooltip: 'add task node',
      class: 'fa fa-flag',
      createLinkToFile: false
    }
  },
  {
    name: 'icon',
    details: {
      node: {
        font: { background: 'white', size: 40, align: 'left', strokeWidth: 1, border: {width: 1} },
        shape: 'image',
        shapeProperties: {
          borderDashes: true, // only for borders
          borderRadius: 6,     // only for box shape
          interpolation: false,  // only for image and circularImage shapes
          useImageSize: false,  // only for image and circularImage shapes
          useBorderWithImage: false,  // only for image shape
          coordinateOrigin: 'center'  // only for image and circularImage shapes
        },
        image: '/assets/nodes/coding.svg',
        imagePadding: 20
      },
      link: { dashes: false, arrows: { to: { enabled: false } }, length: 100 },
      tooltip: 'add icon node',
      class: 'fa fa-picture-o',
      createLinkToFile: true
    }
  }
  ],
  linkTypes: {
    link: { style: {}, name: 'connect selected. last' }
  },
  numberNode: { physics: true, shape: 'circle', color: 'green', fixed: false, font: { align: 'center', size: 40, color: 'white' } },
  numberLink: { length: 200 },
  resultNode: { color: { background: '#f0f8ff', border: '#000000' }, shape: 'box', font: { background: 'white', size: 40 } },
  pathNodeAttribute: { pathNodeAttribute: true },
  pathNode: {},
  filenameNode: {
    color: {
      border: 'white',
      highlight: {
        border: 'black',
        background: 'white'
      },
      hover: {
        border: 'black',
        background: 'white',
        size: "40px"
      }
    }
  },
  failedRefreshNode: {color: {background: 'red'}, shape: 'circularImage', image: '/assets/nodes/warn.svg', font: { background: 'white', size: 40, align: 'left', strokeWidth: 1, border: {width: 1} }}
};

export const allNodeIcons = [
  { path: '\uf002', name: 'fa-search' },
  { code: '\uf0e7', name: 'fa-bolt' },
  { code: '\uf01e', name: 'fa-repeat' },
  { code: '\uf0a1', name: 'fa-bullhorn' },
  { code: '\uf2c3', name: 'fa-id-card-o' },
  { code: '\uf12a', name: 'fa-exclamation' }
];

export const allNodeIconImages = [
  { path: '/assets/nodes/flash.svg', name: 'action' },
  { path: '/assets/nodes/api.svg', name: 'endpoint' },
  { path: '/assets/nodes/link.svg', name: 'usage' },
  { path: '/assets/nodes/statement.svg', name: 'declaration' },
  { path: '/assets/nodes/database.svg', name: 'database reference' },
  { path: '/assets/nodes/refresh.svg', name: 'loop' },
  { path: '/assets/nodes/audit.svg', name: 'condition' },
  { path: '/assets/nodes/circle.svg', name: 'circle' },
  { path: '/assets/nodes/coding.svg', name: 'code' },
  { path: '/assets/nodes/start.svg', name: 'start' },
  { path: '/assets/nodes/finish.svg', name: 'finish' },
];

export const NodeShapes = [
  { faClass: "fa fa-square-o", visShape: 'box' },
  { faClass: "fa fa-circle-thin", visShape: 'circle' },
  { faClass: 'fa fa-database', visShape: 'database'},
  { faClass: 'fa fa-diamond', visShape: 'diamond'},
  { faClass: 'fa fa-dot-circle-o', visShape: 'dot'},
  { faClass: 'fa fa-star', visShape: 'star'},
  { faClass: 'fa fa-caret-up', visShape: 'triangle'},
  { faClass: 'fa fa-caret-down', visShape: 'triangleDown'}
]

export interface NodeStyle {background, border}

export const NodeStyles: NodeStyle[] = [{
  background: '#FFFFFF',
  border: '#6e706e'
},{
  background: '#FFBCB6',
  border: '#F73C3C'
},{
  background: '#FFFFC6',
  border: '#EEEE08'
},{
  background: '#DDADFB',
  border: '#A31AFE'
},{
  background: '#ADFF95',
  border: '#57FE2D'
},{
  background: '#B7EFFE',
  border: '#12CFFE'
},{
  background: '#FFD695',
  border: '#FD9F16'
},{
  background: '#F4EBD0',
  border: '#B68D40'
},{
  background: '#2E8BC0',
  border: '#B1D4E0'
}];




export interface OnDemandJson {
  title: "main drop down title",
  staticFields: [
    {
      value: 1,
      etlName: 'A'
    },
    {
      value: 1,
      etlName: 'B'
    }
  ],
  inputFields: [
    {
      title: 'my date',
      etlName: 'C',
      type: 'date' | 'number' | 'text'
    },
    {
      title: 'my name',
      etlName: 'D',
      type: 'date' | 'number' | 'text'
    }
  ]
  dropDowns: [
    {
      title: 'secondary drop down title 1'
      etlFieldName: 'E',
      values: [
        {
          title: 'option 1',
          value: 10
          staticFields: [
            {
              value: 2,
              etlName: 'F'
            },
            {
              value: 2,
              etlName: 'G'
            }
          ],
          inputFields: [
            {
              title: 'my secondary date',
              etlName: 'H',
              type: 'date' | 'number' | 'text'
            },
            {
              title: 'my secondary name',
              etlName: 'I',
              type: 'date' | 'number' | 'text'
            }
          ]
        }
      ]
    }
  ]
}

export interface result {
  A: 1,
  B: 1,
  C: '01/01/2019',
  D: 'michael',
  E: 'option 1',
  F: 2,
  G: 3,
  H: '01/04/2019'
  I: 'Christian'
}


