import {SearchObject} from "../types.nodejs";
export interface TypeMapping {type: string, regexCondition: string, titleExtraction: string, item: 'edge' | 'node', style: any}

export const exceptRegex="^((?!node_modules).)*$"

export const typesMapping: TypeMapping[] = [
      // {
      //   "type": "public_declarance",
      //   "regexCondition": "public\\s*",
      //   "titleExtraction": ".+\\(",
      //   item: 'node',
      //   "style": {
      //     color: {
      //       border: "#ff0000"
      //     }
      //   }
      // },
      // {
      //   "type": "function local usage",
      //   item: 'node',
      //   "regexCondition": "this\\..*\\(",
      //   "titleExtraction": ".*",
      //   "style": {
      //     color: {
      //       border: "#00ff00"
      //     }
      //   }
      // }
    ]

export const StartSearchJson: SearchObject = {
      title: "",
      pattern: "",
      flags: "gi",
      isRegex: false,
      searchPath: "",
      filenamePattern: "",
      isFileNameRegex: false,
      originalText: '',
      dirPath: ''
    }
