import fetch from './fetch';
const fuzzysort = require('fuzzysort')
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
export default function createDataClient(endpoint) {
    let sizeCount = 1;
    let sizes = new Map();

    let Reddit_relationAPI = "static/forward.php";

    return {
        getRelated,
        getSuggestion,
        getSize
    }

    function getSize(subName) {
        let size = sizes.get(subName);
        return (size || 1) / sizeCount;
    }

    async function getSuggestion(query) {
        if (document.getElementById("switchValue").checked == false) {
            var response = await fetch('https://www.reddit.com/api/subreddit_autocomplete_v2.json?query=' + query + '&raw_json=1&gilding_detail=1', { responseType: 'json' })
            return response.data.children.map(row => {
                var subReddit = row.data.display_name || undefined;
                return { text: subReddit, url: subReddit };
            }).filter(data => data.text !== undefined);
        }
        else if (document.getElementById("switchValue").checked == true) {
            var response = await fetch('https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&format=json&formatversion=2&search=' + query + '&namespace=0&limit=5', { responseType: 'json' })
            return response[1].map(row => {
                var subReddit = row || undefined;
                return { text: subReddit, url: subReddit };
            }).filter(data => data.text !== undefined);
        }
        else {
            alert("Please Select Wikipedia or Sub Reddit");
        }
    }

    async function getRelated(query) {
        let queryName = query;
        let limitNode = ($('#limitNode').val()) == '' ? '7' : $('#limitNode').val();
        limitNode = (limitNode == undefined ? '7' : limitNode);
        let related = [];

        if (limitNode <= 0) {
            $("#limitNode").val(2);
        } else if (limitNode > 25) {
            $("#limitNode").val(25);
        }
        limitNode++;
        const queryString = qs.get();
        if ((document.getElementById("switchValue") && document.getElementById("switchValue").checked == false) || queryString.type === 'subreddit') {
            var lastIndex = queryName.lastIndexOf(" ");
            if (lastIndex !== -1) {
                queryName = queryName.substring(0, lastIndex);
            }

            var url = 'https://gateway.reddit.com/desktopapi/v1/search?rtj=only&allow_over18=&q=' + queryName + '&sort=relevance&type=sr%2Cuser';

            var response = await fetch(Reddit_relationAPI + "?url=" + encodeURIComponent(url), { responseType: 'json' });
            for (const sr in response.subreddits) {
                if (response.subreddits[sr].name)
                    related.push(response.subreddits[sr].name + " " + nFormatter(response.subreddits[sr].subscribers));
            }

            // Get data with &type=link%2Csr%2Cuser parameter to fetch more data
            if (related.length < 2) {
                url = 'desktopapi/v1/search?rtj=only&allow_over18=&include=structuredStyles%2CprefsSubreddit&q=' + queryName + '&sort=relevance&t=all&type=link%2Csr%2Cuser&b=true';

                response = await fetch(Reddit_relationAPI + "?url=" + encodeURIComponent(url), { responseType: 'json' });
                related = [];
                for (const sr in response.subreddits) {
                    const newQuery = response.subreddits[sr].name + " " + nFormatter(response.subreddits[sr].subscribers);
                    if (query !== newQuery && query !== response.subreddits[sr].name)
                        related.push(newQuery);
                    else {
                        query = newQuery;
                    }
                }
                related.unshift(query);
            }
            return related.splice(0, limitNode) || [];
        }

        else if (document.getElementById("switchValue") && (document.getElementById("switchValue").checked == true) || queryString.type === 'wikipedia') {
            var nodes, linkDetails;
            queryName = queryName.split('#')[0];

            var c = await fetchWikiDom(queryName);

            if (document.getElementById("switchValue_wiki") && (document.getElementById("switchValue_wiki").checked == false) || queryString.wikipediaType === 'internalLinks') {
                nodes = c.querySelectorAll(".mw-parser-output > *");
                linkDetails = fetchLinks_internal(nodes);
            }
            else {
                if (c.getElementById("See_also")) {
                    nodes = c.getElementById("See_also").parentNode.nextElementSibling;
                    linkDetails = fetchLinks_seeAlso(nodes);
                } else {
                    linkDetails = [];
                }
            }


            for (var i = 0; i < linkDetails.length; i++) {
                related.push(decodeURI(linkDetails[i]['name']).split('#')[0]);
            }
            related.unshift(queryName);

            return related.splice(0, limitNode) || [];
        }
        else {
            alert("Please Select Wikipedia or Sub Reddit");
        }

    }
}

function nFormatter(num, digits) {
    var si = [
        { value: 1, symbol: "" },
        { value: 1E3, symbol: "k" },
        { value: 1E6, symbol: "M" },
        { value: 1E9, symbol: "G" },
        { value: 1E12, symbol: "T" },
        { value: 1E15, symbol: "P" },
        { value: 1E18, symbol: "E" }
    ];
    var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}

const fetchWikiDom = async (queryName) => {
    var response = await fetch('https://en.wikipedia.org/w/api.php?origin=*&action=parse&prop=text&page=' + queryName + '&format=json', { responseType: 'json' });
    var c = new DOMParser().parseFromString(response.parse.text['*'], "text/xml");
    if (c.querySelectorAll(".redirectText  a").length) {
        return fetchWikiDom(c.querySelectorAll(".redirectText a")[0].getAttribute('href').replace('/wiki/', '').replace(/_/g, ' '));
    } else {
        return c;
    }
};

const fetchLinks_seeAlso = (node, remainedTry = 4) => {
    if (remainedTry <= 0)
        return [];
    var links = node.querySelectorAll('ul > li > a');
    if (!links.length)
        return fetchLinks_seeAlso(node.nextElementSibling, remainedTry - 1);
    var linkDetails = []
    links.forEach(l => linkDetails.push({ URL: l.getAttribute('href'), name: l.innerHTML }));
    return linkDetails;
}

const fetchLinks_internal = (nodes) => {
    var linkDetails = []
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id === 'toc' ||
            nodes[i].tagName == 'h2') {
            break;
        } else if (nodes[i].classList.contains('hatnote') ||
            nodes[i].classList.contains('infobox')) {
            continue;
        }
        var links = nodes[i].querySelectorAll('a');
        links.forEach(l => {
            if (l.getAttribute('href') && l.getAttribute('href').startsWith('/wiki/') && l.getAttribute('href').indexOf(':') === -1 && !l.classList.contains('image'))
                linkDetails.push({ URL: l.getAttribute('href'), name: l.getAttribute('href').replace('/wiki/', '').replace(/_/g, ' ') });
        });
    }
    return linkDetails;
}