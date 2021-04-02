export interface SearchOptions {
  regex: any,
  name: string,
  findClosure?: boolean
}

export class PreSeacrhJsonsUtils {
  public static getSearchStringFromText(text: string, preRegex: string) {
    return preRegex.replace('__TEXT__', text.trim());
  }
}


export interface Languages {language: string, searchOptions: SearchOptions[]}
