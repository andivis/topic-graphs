<template>
  <div id="app" v-bind:class="{'active':(dislaySearch === true)}">
    <p class="manageSearchBox" v-on:click="searchBoxClick" v-if="dislaySearch">
      <span v-on:click="displaySearchOff">⇧</span>
    </p>
    <p class="manageSearchBox" v-on:click="searchBoxClick" v-if="!dislaySearch">
      <span v-on:click="displaySearchOn">⇩</span>
    </p>
    <form v-on:submit.prevent="onSubmit" class="search-box">
      <!-- <input class='search-input' type="text" v-model='appState.query' placeholder='Enter query' autofocus> -->
      <typeahead
        placeholder="Search here..."
        ref:typeahead
        @selected="doSearch"
        :query="appState.query"
        :get-suggestions="getSuggestions"
      ></typeahead>
    </form>
    <div class="extraContent">
      <div class="select_graph_node">
        <span>Graph</span>
        <label class="switch_graph">
          <input
            type="checkbox"
            id="switchValue_Graph"
            @change="onChange($event)"
            :checked="appState.displayType === 'list'"
          />
          <span class="slider_graph round_graph"></span>
        </label>
        <span>List</span>
      </div>

      <div class="select_button" v-bind:class="{'disabled': isLoading}">
        <span>Reddit</span>
        <label class="switch">
          <input type="checkbox" id="switchValue" v-model="relationType" :disabled="isLoading" />
          <span class="slider round"></span>
        </label>
        <span>Wikipedia</span>
      </div>

      <div class="select_button_wiki" v-bind:class="{'disabled': isLoading}" v-if="relationType">
        <span>Internal Links</span>
        <label class="switch_wiki">
          <input type="checkbox" id="switchValue_wiki" v-model="relationWiki" />
          <span class="slider_wiki round_wiki"></span>
        </label>
        <span>See Also</span>
      </div>

      <div class="limitNumberInput" v-bind:class="{'disabled': isLoading}">
        <label for="limitNode">Node Limit:</label>
        <input
          type="number"
          id="limitNode"
          placeholder="7"
          name="limitNode"
          min="1"
          max="25"
          :disabled="isLoading"
        />
      </div>

      <!--<div class="help" v-if="!isLoading">
      The graph of related subreddits
      <a
        href="#"
        @click.prevent="aboutVisible = true"
        class="highlight"
      >Learn more.</a>
      </div>-->
      <div
        class="help"
        id="helpText"
      >When results appear, hold Ctrl and click a node to search for it.</div>
      <div class="help" v-if="isLoading">{{appState.progress.message}}</div>
      <div class="about-line">
        <!-- <a class="about-link" href="#" @click.prevent="aboutVisible = true">about</a>  -->
        <!-- <a class="bold" href="https://github.com/anvaka/sayit">source code</a>  -->
      </div>
      <about v-if="aboutVisible" @close="aboutVisible = false"></about>

      <!-- <div class="welcome" v-if="!appState.hasGraph">
      <h3>Welcome!</h3>
      <p>
        This website renders graph of related subreddits.
        <a
            class="highlight"
            href="#"
            @click.prevent="aboutVisible = true"
          >Click here</a> to learn more, or
          <a class="highlight" href="?query=math">try demo</a>.
        </p>
      </div>-->

      <div class="tooltip" ref="tooltip">{{tooltip.text}}</div>
      <subreddit v-if="subreddit" :name="subreddit" class="preview"></subreddit>
      <div class="close-container" v-if="subreddit">
        <a href="#" @click.prevent="subreddit = null">close</a>
      </div>
    </div>
  </div>
</template>

<script>
import "vuereddit/dist/vuereddit.css";

import appState, { performSearch } from "./appState.js";
import Subreddit from "vuereddit";
import createRenderer from "./lib/createRenderer";
import About from "./components/About";
import Typeahead from "./components/Typeahead";
import bus from "./bus";
import redditDataClient from "./lib/redditDataClient";

export default {
  name: "App",
  data() {
    return {
      aboutVisible: false,
      subreddit: null,
      appState,
      tooltip: {
        text: "",
        x: "",
        y: ""
      },
      relationWiki: appState.wikipediaType == "seeAlso" ? true : false,
      relationType: appState.type == "wikipedia" ? true : false,
      dislaySearch: true
    };
  },
  components: {
    About,
    Typeahead,
    Subreddit
  },
  computed: {
    isLoading() {
      return appState.progress.working;
    }
  },
  methods: {
    searchBoxClick() {
      console.log($("#app").className);
    },
    displaySearchOff() {
      this.dislaySearch = false;
    },
    displaySearchOn() {
      this.dislaySearch = true;
    },
    async doSearch(q) {
      const suggestions = await redditDataClient.getSuggestion(q);
      if (
        !suggestions.length ||
        q.toLowerCase() != suggestions[0].text.toLowerCase()
      ) {
        return alert("There is no data available for '" + q + "'.");
      }
      q = suggestions[0].text;
      this.dislaySearch = false;
      if (document.getElementById("switchValue").checked == false) {
        appState.type = "subreddit";
      } else {
        appState.type = "wikipedia";
        if (document.getElementById("switchValue_wiki").checked == true) {
          appState.wikipediaType = "seeAlso";
        } else {
          appState.wikipediaType = "internalLinks";
        }
      }

      appState.query = q;
      this.onSubmit();
    },
    getSuggestions(input) {
      return redditDataClient.getSuggestion(input);
    },
    onSubmit() {
      $("#ListNode ul").empty();
      $("#helpText").fadeOut();

      if (!appState.query) return;

      performSearch(appState.query, appState.type, appState.wikipediaType);
      this.renderer.render(appState.graph);
      const el = document.querySelector(":focus");
      if (el) el.blur();
    },
    showSubreddit(name) {
      this.subreddit = name;
    },
    onChange(event) {
      //var optionText = event.target.value;
      if (document.getElementById("switchValue_Graph").checked == true) {
        appState.displayType = "list";
        $("#scene").css("display", "none");
        $("#ListNode").css("display", "initial");
        $("#ListNode").addClass("avtive");
        $("#ListNode").css("width", window.innerWidth > 800 ? "70%" : "100%");
      } else {
        appState.displayType = "graph";
        $("#scene").css("display", "initial");
        $("#ListNode").css("display", "none");
        $("#ListNode").removeClass("avtive");
        $("#ListNode").css("width", "0");
      }
    }
  },
  mounted() {
    // history.pushState(
    //   {},
    //   null,
    //   window.location.href.replace(window.location.search, "") + "?query=&type="
    // );

    if (appState.type == "wikipedia") {
      $("#switchValue").prop("checked", true);
      if (appState.wikipediaType == "seeAlso") {
        $("#switchValue_wiki").prop("checked", true);
      } else {
        $("#switchValue_wiki").prop("checked", false);
      }
    } else if (appState.type == "subreddit") {
      $("#switchValue").prop("checked", false);
    }

    if (
      appState.displayType === "list" ||
      document.getElementById("switchValue_Graph").checked == true
    ) {
      $("#scene").css("display", "none");
      $("#ListNode").css("display", "initial");
      $("#ListNode").css("width", "70%");
    } else {
      $("#scene").css("display", "initial");
      $("#ListNode").css("display", "none");
      $("#ListNode").css("width", "0");
    }

    this.renderer = createRenderer(appState.progress);
    bus.on("show-subreddit", this.showSubreddit);
    bus.on("new-search", this.doSearch);

    if (appState.graph) {
      this.renderer.render(appState.graph);
    }
  },

  beforeDestroy() {
    bus.off("show-subreddit", this.showSubreddit);
    bus.off("new-search", this.doSearch);
  },
  updated() {}
};

function downloadCSV(csv, filename) {
  var csvFile;
  var downloadLink;

  // CSV file
  csvFile = new Blob([csv], { type: "text/csv" });

  // Download link
  downloadLink = document.createElement("a");

  // File name
  downloadLink.download = filename;

  // Create a link to the file
  downloadLink.href = window.URL.createObjectURL(csvFile);

  // Hide download link
  downloadLink.style.display = "none";

  // Add the link to DOM
  document.body.appendChild(downloadLink);

  // Click download link
  downloadLink.click();
}
window.exportTableToCSV = () => {
  var csv = ["Relation Level,Related Links"];
  var rows = document.querySelectorAll("#ListNode a");

  for (var i = 0; i < rows.length; i++) {
    if ($(rows[i]).attr("depth") === undefined) {
      continue;
    }

    csv.push($(rows[i]).attr("depth") + "," + rows[i].innerHTML.trim());
    // csv.push(
    //   (word.match(/-- /g) || []).length + "," + word.replace(/-- /g, "")
    // );
  }

  // Download CSV file
  downloadCSV(csv.join("\n"), "relation-list.csv");
};

var listNodes =
  '<div id="ListNode">' +
  '<h4 v-if="appState.hasGraph" onClick="$(this).parent().toggleClass(\'active\')">' +
  '<span onClick="exportTableToCSV()" class="downloadCSV">Download CSV File</span>' +
  "</h4>" +
  "<ul id='myUL'></ul>" +
  "</div>";
$("#app").after(listNodes);

const x = () => {
  console.log("in");
};
</script>

<style lang='stylus'>
@import ('./vars.styl');

#app {
  width: 25%;
  // width: 392px;
  height: 100%;
  overflow-x: auto;
  padding-left: 20px;
  float: left;
  position: relative;

  .extraContent {
    user-select: none; /* Prevent text selection */
    padding: 0 10px;
    line-height: 34px;
    font-size: 18px;
  }
}

#limitNode {
  position: relative;
  -webkit-box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 -1px 0px rgba(0, 0, 0, 0.02);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 -1px 0px rgba(0, 0, 0, 0.02);
  font-size: 16px;
  padding: 5px;
  cursor: text;
  border: 1px solid #EEE;
}

.close-container {
  position: fixed;
  z-index: 2;
  top: 0;
  right: 0;
  height: 40px;

  a {
    padding: 0 12px;
    font-size: 12px;
    color: #fff;
    background-color: #333;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}

.highlight {
  color: highlight-color;
}

rect, path, text {
  transition: stroke 200ms, fill 200ms;
}

.hovered rect, path.hovered {
  stroke: highlight-color;
}

.hovered rect {
  stroke: highlight-color;
}

.help {
  font-size: 12px;
  margin-top: 8px;

  a {
    background: background-color;
  }
}

.special {
  color: highlight-color;
  font-family: monospace;
}

a {
  text-decoration: none;
}

.about-line {
  position: fixed;
  right: 0;
  top: 8px;
  padding: 0px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  a {
    text-align: right;
    background: background-color;
    font-size: 12px;
    padding: 0 8px;
    line-height: 24px;
    height: 24px;
    color: secondary-color;
    border-bottom: 1px solid transparent;

    &:hover, &:focus {
      color: highlight-color;
      border-bottom: 1px dashed;
    }
  }
}

.tooltip {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 -1px 0px rgba(0, 0, 0, 0.02);
  position: fixed;
  background: background-color;
  padding: 8px;
  border: 1px solid border-color;
  pointer-events: none;
  opacity: 0;
  transition-duration: 300ms;
  transition-property: opacity;
}

.tooltip.visible {
  opacity: 1;
}

.search-box {
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 -1px 0px rgba(0, 0, 0, 0.02);
  height: 48px;
  display: flex;
  font-size: 16px;
  padding: 0;
  cursor: text;
  margin: 10px;

  span {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

.subreddit.preview {
  position: fixed;
  right: 0;
  top: 0;
  width: 400px;
  overflow: hidden;

  a {
    target: '_blank';
  }

  .controls {
    position: absolute;
    top: 42px;
    right: 0;
    left: 1px;
    height: 32px;
  }
}

.title-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 42px;
}

.select_button, .select_button_wiki, .select_graph_node {
  padding-top: 20px;
}

.select_button.disabled, .select_button_wiki.disabled, .limitNumberInput.disabled {
  opacity: 0.5;
}

.limitNumberInput {
  padding-top: 20px;
  position: relative;
}

.manageSearchBox {
  display: none;
  text-align: center;
  margin: 0;

  span {
    padding: 8px 15px;
    display: inline-block;
    background: #3333;
    border-radius: 0 0 13px 13px;
    cursor: pointer;
    font-weight: bold;
  }

  span:hover {
    background: #3334;
  }
}

#ListNode {
  display: none;
  background: #FFFB;
  width: 25%;
  height: inherit;
  overflow: scroll;
  position: absolute;
  right: 0;
  overflow: auto;
}

#ListNode .arrow {
  display: none;
}

.downloadCSV {
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
}

/* Remove default bullets */
ul, #myUL {
  list-style-type: none;
}

/* Remove margins and padding from the parent ul */
#myUL {
  margin: 0;
  padding: 0;
  line-height: 24px;
  display: table;

  /* Style the caret/arrow */
  .caret {
    cursor: pointer;
    user-select: none; /* Prevent text selection */
  }

  a:hover {
    color: #f35521;
  }

  /* Create the caret/arrow with a unicode, and style it */
  .caret::before {
    content: '\25B6';
    color: black;
    display: inline-block;
    margin-right: 6px;
  }

  /* Rotate the caret/arrow icon when clicked on (using JavaScript) */
  .caret-down::before {
    transform: rotate(90deg);
  }

  /* Hide the nested list */
  .nested {
    display: none;
  }

  /* Show the nested list when the user clicks on the caret/arrow (with JavaScript) */
  .active {
    display: block;
  }
}

@media (max-width: 800px) {
  #app, svg {
    width: 100%;
    margin: 0;
    float: none;
  }

  #app {
    height: 100%;
    background: transparent;
    position: absolute;
    top: 0;
    padding: 0 3%;
    height: auto;
    background: transparent;
    z-index: 5;
  }

  #app.active {
    height: 100%;
    background: #FFF;
  }

  #ListNode {
    width: 100% !important;
    padding: 20px;
    background: #FFF;
    top: 88vh;
    transition: 0.5s linear;
    z-index: 0;
  }

  #ListNode {
    top: 0;
  }

  #app > form, #app > div {
    display: none;
  }

  #app.active > form, #app.active > div {
    display: inherit;
  }

  .manageSearchBox {
    display: inherit;
  }

  .welcome {
    padding: 16px;
  }

  .help {
    padding: 0 8px;
  }

  .about-line {
    bottom: 0;
    top: initial;
    right: 0;
  }

  .subreddit.preview {
    width: 100%;
  }
}

g.node {
  cursor: pointer;
}

.details-container {
  position: absolute;
  top: 82px;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.read-more {
  linear-gradient(180deg, rgba(255, 255, 255, 0), #fff);
}

.switch, .switch_graph, .switch_wiki {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch #switchValue, .switch_wiki #switchValue_wiki, .switch_graph #switchValue_Graph {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider, .slider_wiki, .slider_graph {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #F35521;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

.slider:before, .slider_wiki:before, .slider_graph:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

#switchValue:checked + .slider, #switchValue_wiki:checked + .slider_wiki, #switchValue_Graph:checked + .slider_graph {
  background-color: #2196F3;
}

#switchValue:focus + .slider, #switchValue_wiki:focus + .slider_wiki, #switchValue_Graph:focus + .slider_graph {
  box-shadow: 0 0 1px #2196F3;
}

#switchValue:checked + .slider:before, #switchValue_wiki:checked + .slider_wiki:before, #switchValue_Graph:checked + .slider_graph:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

.slider.round, .slider_graph.round_graph, .slider_wiki.round_wiki {
  border-radius: 34px;
}

.slider.round:before, .slider_graph.round_graph:before, .slider_wiki.round_wiki:before {
  border-radius: 50%;
}

#ListNode a {
  color: #2196f3;
}

#ListNode a:hover {
  text-decoration: underline;
}

@media (max-height: 550px) {
  .search-box {
    height: 32px;

    input.search-input {
      font-size: 16px;
    }
  }

  .help {
    margin-top: 4px;
  }
}
</style>
