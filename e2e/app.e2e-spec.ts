import { VisualizerPage } from './app.po';

describe('visualizer App', () => {
  let page: VisualizerPage;

  beforeEach(() => {
    page = new VisualizerPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
