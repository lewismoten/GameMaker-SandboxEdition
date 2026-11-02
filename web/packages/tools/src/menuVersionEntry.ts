// A browser-safe door to the menu version stamp (kit/* entry points reject browser imports): the web
// editor stamps a project's version on its menu picture when it hands the files to Play or Export.
export { stampMenuVersion, type MenuVersionSpot } from './kit/menuVersion';
