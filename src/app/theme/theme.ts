export interface Theme {
    name: string;
    properties: any;
  }
  
  export const light: Theme = {
    name: "light",
    properties: {
      "--foreground-default": "#2d2d2d",
      "--foreground-secondary": "#4f4f4f",
      "--foreground-tertiary": "#1a1a1a",
      "--foreground-quaternary": "#F4FAFF",
      "--foreground-light": "#595a5a",
      "--foreground-dark": "#2d2d2d",
      
  
      "--background-default": "#c3c3c3",
      "--background-secondary": "#A3B9CC",
      "--background-tertiary": "#747575",
      "--background-quaternary": "#E5E5E5",
      "--background-light": "#FFFFFF",
      "--background-dark": "#595959",


    




  
      "--primary-default": "#5DFDCB",
      "--primary-dark": "#24B286",
      "--primary-light": "#B2FFE7",
  
      "--error-default": "#EF3E36",
      "--error-dark": "#800600",
      "--error-light": "#FFCECC",
  
      "--background-tertiary-shadow": "0 1px 3px 0 rgba(92, 125, 153, 0.5)"
    }
  };
  
  export const dark: Theme = {
    name: "dark",
    properties: {
      "--foreground-default": "#c3c3c3",
      "--foreground-secondary": "#A3B9CC",
      "--foreground-tertiary": "#747575",
      "--foreground-quaternary": "#E5E5E5",
      "--foreground-light": "#FFFFFF",
      "--foreground-dark": "#595959",
      
  
      "--background-default": "#2d2d2d",
      "--background-secondary": "#4f4f4f",
      "--background-tertiary": "#1a1a1a",
      "--background-light": "#444545",
      "--background-dark":"#2d2d2d",
      "--background-middle":"#595a5a",
  
      "--primary-default": "#5DFDCB",
      "--primary-dark": "#24B286",
      "--primary-light": "#B2FFE7",
  
      "--error-default": "#EF3E36",
      "--error-dark": "#800600",
      "--error-light": "#FFCECC",
  
      "--background-tertiary-shadow": "0 1px 3px 0 rgba(8, 9, 10, 0.5)"
    }
  };
  