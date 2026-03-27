/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import CreateContent from './pages/CreateContent';
import Moderation from './pages/Moderation';
import Kanban from './pages/Kanban';
import Rubriques from './pages/Rubriques';
import Admin from './pages/Admin';
import Explorer from './pages/Explorer';
import ContentDetail from './pages/ContentDetail';
import Gazette from './pages/Gazette';
import GazetteEditor from './pages/GazetteEditor';
import __Layout from './Layout.jsx';

console.log('Pages config - Admin imported:', Admin);
console.log('Pages config - All pages:', { Dashboard, Teams, TeamDetail, CreateContent, Moderation, Kanban, Rubriques, Admin, Explorer, ContentDetail, Gazette, GazetteEditor });

export const PAGES = {
    "Dashboard": Dashboard,
    "Teams": Teams,
    "TeamDetail": TeamDetail,
    "CreateContent": CreateContent,
    "Moderation": Moderation,
    "Kanban": Kanban,
    "Rubriques": Rubriques,
    "Admin": Admin,
    "Explorer": Explorer,
    "ContentDetail": ContentDetail,
    "Gazette": Gazette,
    "GazetteEditor": GazetteEditor,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};