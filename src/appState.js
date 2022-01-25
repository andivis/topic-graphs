import buildGraph from './lib/buildGraph';
import Progress from './Progress';

const queryState = require('query-state');

const qs = queryState(
    {
        query: '',
        type: '',
        wikipediaType: '',
        displayType: ''
    },
    {
        useSearch: true
    }
);

let lastBuilder;
const appStateFromQuery = qs.get();
const appState = {
    hasGraph: false,
    maxDepth: appStateFromQuery.maxDepth || 2,
    progress: new Progress(),
    graph: null,
    query: appStateFromQuery.query,
    type: appStateFromQuery.type,
    wikipediaType: appStateFromQuery.wikipediaType,
    displayType: appStateFromQuery.displayType
};

if (appState.query) {
    performSearch(appState.query, appState.type, appState.wikipediaType);
}

export default appState;

qs.onChange(updateAppState);

function updateAppState(newState) {
    appState.query = newState.query;
}

export function performSearch(queryString, type, wikipediaType) {
    appState.hasGraph = true;
    appState.progress.reset();

    qs.set('query', queryString);
    qs.set('type', type);

    if (type == 'subreddit') {
        qs.set('wikipediaType', '');
    }
    else {
        qs.set('wikipediaType', wikipediaType);
    }

    if (lastBuilder) {
        lastBuilder.dispose();
    }

    lastBuilder = buildGraph(queryString, appState.maxDepth, appState.progress);
    lastBuilder.graph.rootId = queryString;
    appState.graph = Object.freeze(lastBuilder.graph);
    return lastBuilder.graph;
}
