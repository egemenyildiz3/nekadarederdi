import { renderToString } from 'react-dom/server';
import App from './App';
export { PAGES, CONTENT_UPDATED } from '../../shared/routes';
export { default as catalog } from '../../data/market-series.json';
export function render(pathname: string) {
  return renderToString(<App pathname={pathname} />);
}
