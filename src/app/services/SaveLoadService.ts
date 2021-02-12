import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { catchError, map } from "rxjs/operators";
import { Edge, Node } from "vis";
import { SelectedDiagramInfo } from "../app.component";
import { EndPoints } from "../types.nodejs";
import { Env } from "../utils/Env";

interface DiagramMetadataStringArrays {
  projects?: string[]
  fileNames?: string[]
  labels?: string[]
}

export interface DiagramMetadata extends DiagramMetadataStringArrays {
  positioning?: number
  description?: string
  story?: string
  type?: string // task, description, bug, etc.
  user?: string
}
export interface CreateDiagramDto extends DiagramMetadata {
  data?: any
}

interface ResultMetadata extends DiagramMetadata {
  id: number
  createdAt: string
  updatedAt: string
}

export interface FullDiagramDto extends ResultMetadata {
  data: any
}

export interface ResultDiagram {
  metadata: ResultMetadata
  results: DiagramMetadataStringArrays
}

export interface QueryDto {
  description?: string
  story?: string
  labels?: string
  user?: string
  type?: string
  projects?: string
  fileNames?: string
  general?: string,
}


export interface ResultDiagramUI extends QueryDto {
  data?: {
    nodes: Node[],
    edges: Edge[]
  },
  id: number,
  projectList: string[],
  createdAt?: string,
  updatedAt?: string
}


interface SaveInfo {
  savedDiagramDetails: SelectedDiagramInfo,
  nodes: Node[],
  edges: Edge[],
  filenames: string[],
  labels: string[]

}

@Injectable()
export class SaveLoadService {

  getById(id: any): Observable<ResultDiagramUI> {
    return this.http.get(Env.getApiEndpoint() + EndPoints.loadDiagram + id).pipe(
      map((response: FullDiagramDto) => {
        let result: ResultDiagramUI = Object.assign(
          response, {
            fileNames: response.fileNames ? response.fileNames.join(" ; ") : "",
            labels: response.labels ? response.labels.join(" ; ") : "",
            projects: response.projects ? response.projects.join(" ; ") : "",
            projectList: response.projects
          }
        )
        return result
      })
    )
  }
  constructor(public http: HttpClient) { }

  save(params: SaveInfo, isNew = true) {
    let savedInfo: CreateDiagramDto = Object.assign({
      data: {
        nodes: params.nodes,
        edges: params.edges
      }
    }, params.savedDiagramDetails, { labels: params.labels, fileNames: params.filenames, projects: params.savedDiagramDetails.projectList })
    delete savedInfo['projectList']

    if (isNew) {
      delete savedInfo['id']
      return this.http.post(Env.getApiEndpoint() + EndPoints.saveDiargam, savedInfo)
    }
    else return this.http.post(Env.getApiEndpoint() + EndPoints.updateDiagram, savedInfo)
  }

  public getResults(searchObject: QueryDto): Promise<ResultDiagramUI[]> {
    return this.http.post(Env.getApiEndpoint() + EndPoints.searchDiagram, searchObject).pipe(
      map((data: ResultDiagram[]) => {
        let results: ResultDiagramUI[] = []
        data.forEach(apiDiagram => {
          let result: ResultDiagramUI = {id: null, projectList: []}
          for (let key in apiDiagram.metadata) {
            let value = apiDiagram.metadata[key]
            if (!value) continue
            result[key] = value
          }
          for (let key in apiDiagram.results) {
            let value = apiDiagram.results[key]
            if (!value) continue
            result[key] = value.join(' ; ')
          }
          results.push(result)
        })
        return results;
      })
    ).toPromise<ResultDiagramUI[]>()
  }

}
