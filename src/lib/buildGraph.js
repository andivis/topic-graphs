import bus from '../bus';
import redditDataClient from './redditDataClient';

export default function buildGraph(entryWord, MAX_DEPTH, progress) {
    entryWord = entryWord && entryWord.trim();
    if (!entryWord) return;

    // entryWord = entryWord.toLocaleLowerCase();

    let cancelled = false;
    let pendingResponse;
    let graph = require('ngraph.graph')();
    graph.maxDepth = MAX_DEPTH;
    let queue = [];
    let requestDelay = 100;
    progress.startDownload();

    startQueryConstruction();

    return {
        dispose,
        graph
    }

    function dispose() {
        cancelled = true;
        if (pendingResponse) {
            // pendingResponse.cancel();
            pendingResponse = null;
        }
    }

    function startQueryConstruction() {
        fetchNext(entryWord);
    }

    function loadSiblings(results) {
        const parent = results[0];
        var parentNode = graph.getNode(parent);

        let depth = 0;
        if (!parentNode) {
            window.graphBuiltWith = (document.getElementById("switchValue").checked == false) ? "subreddit" : "wikipedia";
            parentNode = graph.addNode(parent, {
                depth: 0,
                size: redditDataClient.getSize(parent)
            });
        }

        results.forEach((other, idx) => {
            const hasOtherNode = graph.hasNode(other);
            if (hasOtherNode) {
                const hasOtherLink = graph.getLink(other, parent) || graph.getLink(parent, other);
                if (!hasOtherLink) {
                    graph.addLink(parent, other);
                }
                return;
            }

            depth = parentNode.data.depth + 1;
            graph.addNode(other, { depth, size: redditDataClient.getSize(other) });
            graph.addLink(parent, other);
            if (depth < MAX_DEPTH) queue.push(other);
        });
        if (depth === 1) {
            $("#ListNode ul#myUL").html(
                `<li><span class="caret caret-down" ` +
                `onClick="$(this).next().toggleClass('active');$(this).toggleClass('caret-down')">` +
                `<a href="${getLink(parent)}" depth="0" target="_blank" onClick="event.stopPropagation();">${parent}</a></span> <a href="${getSearchLink(parent)}">🔍</a><ul class="nested active"></ul></li>`
            );
        } else {
            $("#ListNode ul#myUL > li > ul").append(``);
            if (results.length > 1) {
                var childNode = `<li><span class="caret caret-down" ` +
                    `onClick="$(this).next().toggleClass('active');$(this).toggleClass('caret-down')">` +
                    `<a href="${getLink(parent)}" target="_blank" depth="1" onClick="event.stopPropagation();">${parent}</a></span> <a href="${getSearchLink(parent)}">🔍</a>`;
                childNode += `<ul class="nested active">`;
                for (var i = 1; i < results.length; i++) {
                    childNode += `<li><a href="${getLink(results[i])}" depth="2" target="_blank">${results[i]}</a> <a href="${getSearchLink(results[i])}">🔍</a></li>`;
                }
                childNode += `</ul>`;
            } else {
                var childNode = `<li><a href="${getLink(parent)}" target="_blank" depth="1" onClick="event.stopPropagation();">${parent}</a> <a href="${getSearchLink(parent)}">🔍</a>`;
            }
            childNode += `</li>`;
            $("#myUL > li > ul").append(childNode);
        }
        setTimeout(loadNext, requestDelay);
    }

    function getLink(nodeId) {
        let trimID = '';
        if (document.getElementById("switchValue").checked == true) {
            trimID = nodeId;
        } else {
            var lastIndex = nodeId.lastIndexOf(" ");
            if (lastIndex !== -1) {
                trimID = nodeId.substring(0, lastIndex);
            }
        }
        return (graphBuiltWith == "subreddit") ? 'https://www.reddit.com/r/' + trimID : 'https://en.wikipedia.org/wiki/' + nodeId;
    }

    function getSearchLink(nodeId) {
        let trimID = '';
        if (document.getElementById("switchValue").checked == true) {
            trimID = nodeId;
        } else {
            var lastIndex = nodeId.lastIndexOf(" ");
            if (lastIndex !== -1) {
                trimID = nodeId.substring(0, lastIndex);
            }

            nodeId = trimID;
        }

        let result = window.location.pathname + '?';

        if ('URLSearchParams' in window) {
            var searchParams = new URLSearchParams(window.location.search);

            searchParams.set("query", nodeId);
            searchParams.set("displayType", "list");

            let parametersString = searchParams.toString();
            parametersString = parametersString.replace(/\+/g, "%20");

            result += parametersString;
        }

        return result;
    }

    function loadNext() {
        if (cancelled) return;
        if (queue.length === 0) {
            bus.fire('graph-ready', graph);
            return;
        }

        let nextWord = queue.shift();
        fetchNext(nextWord);
        progress.updateLayout(queue.length, nextWord);
    }

    function fetchNext(query) {
        pendingResponse = redditDataClient.getRelated(query);
        pendingResponse.then(res => onPendingReady(res, query)).catch((msg) => {
            const err = 'Failed to download ' + query + '; Message: ' + msg;
            console.error(err);
            progress.downloadError(err)
            loadNext();
        });
    }

    function onPendingReady(res, query) {
        if (!res || !res.length) res = [query];
        loadSiblings(res);
    }

    function search(nodeId) {
        console.log('search');
        console.log(nodeId);
        bus.fire('new-search', nodeId);
    }
}