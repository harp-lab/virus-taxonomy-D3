// Create the ICTV namespace if it doesn't already exist.
if (!window.ICTV) {
  window.ICTV = {};
}

window.ICTV.d3TaxonomyVisualization = function (
  containerSelector_,
  dataURL_,
  releases_,
  taxonDetailsURL_
) {
  // Validate input parameters

  if (!containerSelector_) {
    throw new Error("Invalid container selector");
  }
  const containerSelector = containerSelector_;

  if (!dataURL_) {
    throw new Error("Invalid data URL");
  }
  const dataURL = dataURL_;

  if (!releases_) {
    throw new Error("Invalid releases");
  }
  const releases = releases_;

  if (!taxonDetailsURL_) {
    throw new Error("Invalid taxon details URL");
  }
  const taxonDetailsURL = taxonDetailsURL_;

  // Configuration settings (to replace hard-coded values below)
  const settings = {
    animationDuration: 900,
    node: {
      radius: 15,
      strokeWidth: 3,
      textDx: 35,
      textDy: 25,
    },
    svg: {
      height: $(window).height() * 0.8,
      margin: {
        top: 0, //50,
        right: 0, //90,
        bottom: 0, //50,
        left: 0, //90
      },
      width: $(window).width(),
    },
    tooltipOffsetX: 25,
    tooltipOffsetY: 0,
    xFactor: 0.5, // TODO: this is influencing Y offset, not X
    yFactor: 300,
    yOffset: 0,
    zoom: {
      scaleFactor: 0.19, //.17,
      translateX: -($(window).width() * 2.5), //-3850,
      translateY: -($(window).height() * 0.45), //-1800
    },
  };
  var selected;
  var num_flag = false;
  var num;
  var check;
  var toolTip = false;
  // var dx=0;
  var Slider = false;
  var arr = [];
  var temp = 0;
  var rankYear = 0;
  var Flag = true;
  var max = 0;
  var fs = 0;
  //declaring the slider
  var slider = d3
    .select(".taxonomy-panel")
    .append("input")
    .style("display", "None")
    .attr("class", "slider")
    .attr("type", "range")
    .attr("min", 4)
    .attr("max", 8)
    .attr("value", 4);

  var Text = d3
    .select(".taxonomy-panel")
    .append("h4")
    .attr("class", "text_slider")
    .text("Font-Slider")
    .style("display", "None");

  // This will be populated with a release's species data.
  let speciesData = null;
  // Initialize the release control with MSL releases.
  initializeReleaseControl(releases);
  function displaySpecies(
    parentName,
    parentRank,
    hasSpecies,
    check,
    parentTaxNodeID
  ) {
    var species_flag = false;
    // Validate the parameters
    // if (!releases_) { throw new Error("Invalid releases in initializeReleaseControl"); }
    if (!parentName || parentName.length < 1) {
      throw new Error("Error in displaySpecies: Invalid parent name parameter");
    }
    if (!parentRank || parentRank.length < 1) {
      throw new Error("Error in displaySpecies: Invalid parent rank parameter");
    }
    if (!parentTaxNodeID || isNaN(parseInt(parentTaxNodeID))) {
      throw new Error(
        "Error in displaySpecies: Invalid parent taxNodeID parameter"
      );
    }
    const strTaxNodeID = new String(parentTaxNodeID);
    // Get all species associated with the parent.
    const speciesArray = speciesData[strTaxNodeID];
    // if (!speciesArray) { throw new Error(`Invalid species array for taxnodeID ${parentTaxNodeID}`); }
    const speciesPanelEl = document.querySelector(
      `${containerSelector} .species-panel`
    );

    if (!speciesPanelEl) {
      throw new Error("Invalid species panel element");
    }
    const nameEl = speciesPanelEl.querySelector(".parent-name");

    if (!nameEl) {
      throw new Error("Invalid parent name element");
    }

    if (speciesArray === null) {
      nameEl.innerHTML = "";
      species_flag = true;
    }
    // Populate the parent name panel.
    console.log(speciesArray);
    if (hasSpecies) {
      nameEl.innerHTML = `Species of ${parentRank} <em>${parentName}<\em>`;
    } else {
      nameEl.innerHTML = "";
    }
    const listEl = speciesPanelEl.querySelector(".species-list");
    if (!listEl) {
      throw new Error("Invalid species list element");
    }
    listEl.innerHTML = "";
    if (species_flag === false) {
      speciesArray.forEach(function (species) {
        const speciesEl = document.createElement("div");
        speciesEl.className = "species-row";
        speciesEl.innerHTML = species.name;
        speciesEl.setAttribute("data-taxnode-id", species.taxNodeID);

        speciesEl.addEventListener("click", function (e) {
          const taxNodeID = e.target.getAttribute("data-taxnode-id");

          window.open(`${taxonDetailsURL}?taxnode_id=${taxNodeID}`, "_blank");
        });

        listEl.appendChild(speciesEl);
      });
    } else {
      const speciesEl = document.createElement("div");
      speciesEl.className = "species-row";
      speciesEl.innerHTML = "";
    }
  }

  // Return the color associated with this rank name and whether or not the node has child nodes.
  function getRankColor(hasChildren_, rankName_) {
    switch (rankName_) {
      case "realm":
      case "subrealm":
        return hasChildren_ ? "#fff" : "#006600";

      case "kingdom":
      case "subkingdom":
        return hasChildren_ ? "#fff" : "#278627";

      case "phylum":
      case "subphylum":
        return hasChildren_ ? "#fff" : "#00426D";

      case "class":
      case "subclass":
        return hasChildren_ ? "#fff" : "#3D79AA";

      case "order":
      case "suborder":
        return hasChildren_ ? "#fff" : "#006CB5";

      case "family":
      case "subfamily":
        return hasChildren_ ? "#fff" : "#258DE4";

      case "genus":
      case "subgenus":
        return hasChildren_ ? "#fff" : "#99D7FF";

      default:
        return null;
    }
  }

  // Initialize the release control with MSL releases.
  function initializeReleaseControl(releases_) {
    // for(var i=0;i<releases_.length;i++){
    // console.log(releases_[i].year);
    if (!releases_) {
      throw new Error("Invalid releases in initializeReleaseControl");
    }

    const speciesPanelEl = document.querySelector(
      `${containerSelector} .species-panel`
    );
    if (!speciesPanelEl) {
      throw new Error("Invalid species panel element");
    }

    const controlEl = document.querySelector(
      `${containerSelector} .release-panel .release-ctrl`
    );
    if (!controlEl) {
      throw new Error("Invalid release control");
    }
    // Clear any existing options
    controlEl.innerHTML = null;
    // speciesPanelEl.innerHTML = null;
    // Add an option for each release.
    releases_.forEach(function (release) {
      const option = document.createElement("option");
      option.text = release.year;
      option.value = isNaN(parseInt(release.year.substr(0, 2)))
        ? "2022"
        : release.year;
      controlEl.appendChild(option);
    });

    // Add a "change" event handler

    controlEl.addEventListener("change", function (e) {
      speciesPanelEl.querySelector(".parent-name").innerHTML = "";
      speciesPanelEl.querySelector(".species-list").innerHTML = "";
      displayReleaseTaxonomy(e.target.value);
    });
    // speciesPanelEl.addEventListener("change", function(e) {
    //           displaySpecies(parentName, parentRank, parentTaxNodeID,e.target.value)

    // })
    //  rankCount=releases_[i].rankCount;

    // }
  }

  // Display the taxonomy tree for the release selected by the user.
  async function displayReleaseTaxonomy(release_) {
    check = rankYear;
    //fetching the rankCont
    for (let i = 0; i < releases_.length; i++) {
      if (releases_[i].year == release_) {
        var rankCount = releases_[i].rankCount;
        rankYear = releases_[i].year;
        console.log("RANK", rankYear);
        num = 0;
        temp = 0;
        arr = [];
        Flag = false;
        num_flag = false;
        max = 0;
        break;
      }
    }
    console.log("rankCount : ", rankCount);
    // Validate the release parameter. If the first 2 characters are numeric, we will assume it's valid.
    if (!release_ || isNaN(parseInt(release_.substr(0, 2)))) {
      throw new Error("Invalid release in displayReleaseTaxonomy");
    }

    // If there's already an SVG element in the taxonomy panel, delete it.
    let existingSVG = document.querySelector(
      `${containerSelector} .taxonomy-panel svg `
    );
    if (!!existingSVG) {
      existingSVG.remove();
    }
    // let exisitngSpecies=document.querySelector(`${containerSelector} .species-panel svg `);
    // if(exisitngSpecies){
    //     exisitngSpecies.innerHTML="";
    // }

    // Determine the filenames for the non-species and species JSON files.
    const nonSpeciesFilename = `${dataURL}/data/nonSpecies_${release_}.json`;
    const speciesFilename = `${dataURL}/data/species_${release_}.json`;

    // Load the species data for this release.
    speciesData = await d3.json(speciesFilename).then(function (s) {
      // document.querySelector(`${containerSelector} .species-panel`).innerHTML="";
      return s;
    });
    if (!speciesData) {
      throw new Error(`Invalid species data for release ${release_}`);
    }

    // Load the non-species data for this release.
    d3.json(nonSpeciesFilename).then(function (data) {
      const ab = d3.hierarchy(data, function (d) {
        if (d.children === null) {
          // console.log("NA")
        } else {
          do {
            let str = d.child_counts;
            // console.log("STR",str,d.data.name);
            var result;
            const regex = /(\d+)/;
            if (typeof str === "string" && str.length > 0) {
              if (str.includes("species")) {
                result = str.replace(/, .*species|,.*$/, "");
              } else {
                result = str?.match(regex);
              }
            }
            if (typeof result === "string" && result.length > 0) {
              num = parseInt(result.match(/\d+/)[0]);
              if (num > 500) {
                num = temp;
              } else {
                if (num > temp) {
                  arr.push(temp);
                  temp = num;
                }
              }
            }
          } while (num >= 1000);
          max = Math.max(...arr);

          num_flag = true;
          return d.children;
        }
      });
      console.log("NUM", max);
    });
    d3.json(nonSpeciesFilename).then(function (data) {
      var genus = false;

      // dmd 02/07/23 Moved to settings.
      //var margin = { top: 50, right: 90, bottom: 50, left: 90 };

      // dmd 02/07/23 Set the width and height available within the SVG.
      const availableHeight =
        settings.svg.height -
        settings.svg.margin.left -
        settings.svg.margin.right;
      const availableWidth =
        settings.svg.width -
        settings.svg.margin.top -
        settings.svg.margin.bottom;

      function handleZoom(e) {
        d3.select(`${containerSelector} svg g`).attr("transform", e.transform);
      }
      let zoom = d3.zoom().on("zoom", handleZoom);

      let drag = d3
        .drag()
        .on("start", start)
        .on("drag", dragged)
        .on("end", dragend);

      function start(d) {
        d.fixed = true;
      }

      function dragged() {
        var x = event.x;
        var y = event.y;
        var current = d3.select(`${containerSelector} svg g`);
        current.attr("transform", `translate(${x},${y})`);
      }

      function dragend(d) {
        d.fixed = false;
      }

      // TODO: Consider renaming "ds" to "root"
      const ds = d3.hierarchy(data, function (d) {
        if (d.children === null) {
          // console.log("NA")
        } else {
          do {
            let str = d.child_counts;
            // console.log("STR",str,d.data.name);
            var result;
            const regex = /(\d+)/;
            if (typeof str === "string" && str.length > 0) {
              if (str.includes("species")) {
                result = str.replace(/, .*species|,.*$/, "");
              } else {
                result = str?.match(regex);
              }
            }
            if (typeof result === "string" && result.length > 0) {
              num = parseInt(result.match(/\d+/)[0]);
              if (num > 500) {
                num = temp;
              } else {
                if (num > temp) {
                  arr.push(temp);
                  temp = num;
                }
              }
            }
          } while (num > 1000);
          const max = Math.max(...arr);
          //  console.log("NUM",max);
          num_flag = true;
          return d.children;
        }
      });

      // changing the font on change of slider
      slider.on("input", function (e) {
        const fontSize = e.target.value;
        // console.log("FONT_SIZE",(e.target.value/2));
        const r = e.target.value;
        console.log("FONT", fontSize);
        font = "";
        font = fontSize + "rem";
        console.log("FOnt", font);
        d3.selectAll("text").style("font-size", font);
        getBBox(ds);
      });
      // Create and populate the tree structure.
      createTree(ds);
      //displaying the slider only if a release is selected
      slider.style("display", "block");
      Text.style("display", "block");

      // TODO: this needs a more informative name.
      var i = 0;

      function createTree(ds) {
        var svg = d3
          .select(`${containerSelector} .taxonomy-panel`)
          .append("svg")
          .attr("width", settings.svg.width)
          .attr("height", settings.svg.height)
          .append("g")
          .attr(
            "transform",
            `translate(${settings.svg.margin.left},${settings.svg.margin.top})`
          );

        var svg_zoom = d3
          .select(`${containerSelector} .taxonomy-panel svg`)
          // dmd 02/07/23 Moved values to settings.
          .call(
            zoom.translateBy,
            settings.zoom.translateX,
            settings.zoom.translateY
          )
          .call(zoom.scaleBy, settings.zoom.scaleFactor)
          .call(zoom)
          .on("dblclick.zoom", null);
        // Use d3 to generate the tree layout/structure.
        const treeLayout = d3.tree().size([availableHeight, availableWidth]);

        treeLayout(ds);

        // TEST
        //ds.x0 = -100;
        ////ds.x0 = (availableHeight / 4);
        //ds.y0 = -100;

        function pageNodes(d, maxNode) {
          console.log("MAX", max);

          if (d.children) {
            d.children.forEach((c) => pageNodes(c, maxNode));
            if (d.children.length > maxNode) {
              d.pages = {};
              const count = maxNode - 2;
              const l = Math.ceil(d.children.length / count);
              for (let i = 0; i < l; i++) {
                let startRange = i * count;
                let endRange = i * count + count;
                d.pages[i] = d.children.slice(startRange, endRange);
                d.pages[i].unshift({
                  ...d.pages[i][0],
                  data: {
                    name: "Up",
                    rankName: "Shift",
                    rankIndex: rankCount - 2,
                  },
                  page: i == 0 ? l - 1 : i - 1,
                });
                d.pages[i].push({
                  ...d.pages[i][0],
                  data: {
                    name: "Down",
                    rankName: "Shift",
                    rankIndex: rankCount - 2,
                  },
                  page: i != l - 1 ? i + 1 : 0,
                });
              }
              d.children = d.pages[0];
            }
          }
        }

        ds.children.forEach((c) => pageNodes(c, 90));

        ds.children.forEach(collapse);

        update(ds);

        function collapse(d) {
          if (d.children) {
            if (
              d.data.name === "Unassigned" &&
              d.data.rankName === "realm" &&
              d.data.taxNodeID !== "legend"
            ) {
              // No name, a rank of "realm", and not part of the legend.
              d._children = d.children;
              d._children.forEach(collapse);
              d.children = null;
            } else if (
              d.data.name === "Unassigned" &&
              d.data.has_assigned_siblings !== true &&
              d.data.has_unassigned_siblings !== true
            ) {
              // No name and it doesn't have assigned or unassigned siblings (so no siblings?).
              // TODO: the if condition above can be simplified to:
              //      !d.data.name && !d.data.has_assigned_siblings && !d.data.has_unassigned_siblings

              // dmd 02/08/23 Moved out of the for loop below.
              //d.children.forEach(collapse);

              // dmd 02/08/23 The for loop appears to be unnecessary.
              for (var i = 0; i < 1; i++) {
                // dmd 02/08/23 "open" isn't referenced anywhere
                var open = d.children[i];
                d.children.forEach(collapse);
              }
              // dmd 02/08/23 "display" isn't referenced anywhere
              //display = false;
            } else {
              // If the node has either assigned or unassigned siblings.
              // TODO: "if (d.data.children.name === null)"" can be included in the if condition below.
              if (
                d.data.has_assigned_siblings === true ||
                d.data.has_unassigned_siblings === true
              ) {
                // TODO: does the "children" array have a name attribute?
                //console.log("in collapse d.data.children.name = ", d.data.children.name)
                if (d.data.children.name === null) {
                  d._children = d.children;
                  d._children.forEach(collapse);
                  d.children = null;
                }
              }
              d._children = d.children;
              d._children.forEach(collapse);
              d.children = null;
            }
          }
        }

        function update(source) {
          if (!source) {
            console.log("in update and source is invalid");
          }

          var info = treeLayout(ds);
          var parent = info.descendants();
          var currentNodeCount = parent.length;
          const scaleFactor = Math.min(1, settings.svg.height / 90);
          const dx = 21 * scaleFactor;
          const dy = settings.svg.height / (currentNodeCount + 1);
          treeLayout.nodeSize([dx, dy]);
          console.log("CURR", currentNodeCount / max);
          links = info.descendants().slice(1);
          const treeNodes = treeLayout(ds);
          treeNodes.each((d) => {
            const x = d.x; // the x-coordinate of the node in the layout
            const y = d.y; // the y-coordinate of the node in the layout
            // use x and y to position the node in the visualization
          });

          parent.forEach(function (d) {
            // console.log(rankCount);
            var h = settings.svg.height / 125;
            var w = (settings.svg.width * 5) / rankCount;

            // /var g=availableWidth/rankCount;
            // var h=d.data.rankIndex*f;
            // console.log("STR",d.data.child_counts);
            let str = d.data.child_counts;
            // console.log("STR",str,d.data.name);
            var result;
            const regex = /(\d+)/;
            if (typeof str === "string" && str.length > 0) {
              if (str.includes("species")) {
                result = str.replace(/, .*species|,.*$/, "");
              } else {
                result = str?.match(regex);
              }
            }
            if (typeof result === "string" && result.length > 0) {
              num = parseInt(result.match(/\d+/)[0]);
              console.log(num);
            }

            d.x = d.x * h;
            d.y = d.depth * w;
          });

          var children = svg.selectAll("g.node").data(parent, function (d) {
            return d.id || (d.id = ++i);
          });

          var Enter = children
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
              if (!d || isNaN(source.x0) || isNaN(source.y0)) {
                return null;
              }
              return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", click)
            .on("mouseover", showTooltip)
            // .on("mousemove", mousemove)
            .on("mouseout", hideTooltip);

          Enter.append("rect")
            .style("stroke", "black")
            .style("stroke-width", "3px")
            .attr("width", function (d) {
              if (d.data.name === null) {
                if (
                  d.data.rankName === "realm" &&
                  d.data.taxNodeID !== "legend"
                ) {
                  return "30px";
                } else if (
                  d.data.has_assigned_siblings === true ||
                  d.data.has_unassigned_siblings === true
                ) {
                  return "30px";
                } else {
                  return "0px";
                }
              }
            })
            .attr("height", function (d) {
              if (d.data.name === "Unassigned") {
                if (
                  d.data.rankName === "realm" &&
                  d.data.taxNodeID !== "legend"
                ) {
                  return "30px";
                } else if (
                  d.data.has_assigned_siblings === true &&
                  d.data.has_unassigned_siblings === true
                ) {
                  return "30px";
                } else {
                  return "0px";
                }
              }
            })
            .style("fill", function (d) {
              let color = getRankColor(!!d._children, d.data.rankName);
              if (!!color) {
                return color;
              }

              findParent(d);
            })
            .attr("dx", settings.node.textDx)
            .attr("dy", settings.node.textDy)
            .attr("x", function (d) {
              return d.children ? -10: -10;
            })
            .attr("y",-10)
            .attr("cursor", "pointer");

          Enter.append("circle")
            .attr("class", "node")
            .attr("r", function (d) {
              if (d.data.name !== "Unassigned") {
                return settings.node.radius;
              } else {
                return 0;
              }
            })
            .style("stroke", "black")
            .style("stroke-width", `${settings.node.strokeWidth}px`)
            .style("fill", function (d) {
              let color = getRankColor(!!d._children, d.data.rankName);
              if (!!color) {
                return color;
              }

              findParent(d);
            })
            .style("opacity", function (d) {
              // TODO: what is this doing?
              return !d.data.parentDistance ? 0 : 1;
            })
            .style("pointer-events", function (d, i) {
              return !d.data.parentDistance ? "none" : "all";
            });
          function getBB(ds) {
            ds.each(function (d) {
              d.bbox = this.getBBox();
            });
          }

          Enter.append("text")
            .attr("dy", ".35rem")
            .attr("x", function (d) {
              return d.children ? -13 : 13;
            })
            .attr("class", function (d) {
              return d.data.taxNodeID === "legend"
                ? "legend-node-text"
                : "node-text";
            })
            // TODO: aren't these overridden below?
            //.attr("dy", '7')
            //.attr('dx', '5')
            .attr("x", function (d, i) {
              if (d.data.rankIndex === 0) {
                return d.children || d._children ? 10 : -10;
              } else if (d.data.taxNodeID !== "legend") {
                return d.children || d._children ? 0 : 10;
              }
            })
            .attr("text-anchor", function (d) {
              if (d.data.rankIndex === 0) {
                return d.children || d._children ? "start" : "end";
              } else if (
                d.data.has_species !== 0 &&
                d.data.taxNodeID !== "legend" &&
                d.data.rankIndex === rankCount - 1
              ) {
                return d.children || d._children ? "end" : "start";
              }
            })
            .style("font-size", "4rem")
            .attr("dx", settings.node.textDx)
            .attr("dy", settings.node.textDy)
            .text(function (d) {
              if (d.data.name === "Unassigned" || d.data.rankName === "tree") {
                if (d.data.taxNodeID === "legend") {
                  // dmd 02/08/23
                  // Don't display "species" in the legend.
                  if (d.data.rankName === "species") {
                    return "";
                  }
                  return d.data.rankName;
                } else if (
                  d.data.rankName === "realm" ||
                  d.data.has_assigned_siblings === true
                ) {
                  return "Unassigned";
                } else {
                  return "";
                }
              } else {
                return d.data.name;
              }
            })
            .attr("fill", function (d) {
              return "#000000";
            })
            .on("click", function (e, d) {
              slider.attr("value", 4);
              console.log("in click d = ", d, num);
              //  check=rankYear;
              return displaySpecies(
                d.data.name,
                d.data.rankName,
                d.data.has_species,
                check,
                d.data.taxNodeID,
                release_
              );
            })
            .attr("dx", settings.node.textDx)
            .attr("dy", settings.node.textDy)
            .call(getBB);
          Enter.insert("rect", "text")
            .attr("x", function (d) {
              return d.bbox.x;
            })
            .attr("y", function (d) {
              return d.bbox.y;
            })
            .attr("width", function (d) {
              return d.bbox.width;
            })
            .attr("height", function (d) {
              return d.bbox.height;
            })
            .style("fill", "white")
            .attr("dx", settings.node.textDx)
            .attr("dy", settings.node.textDy)
            ;

          var Update = Enter.merge(children);
          Update.transition()
            .duration(settings.animationDuration)
            .attr("transform", function (d) {
              return "translate(" + d.y + "," + d.x + ")";
            });

          Update.select("rect")
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .attr("width", function (d) {
              if (d.data.name === "Unassigned") {
                if (
                  d.data.rankName === "realm" &&
                  d.data.taxNodeID !== "legend"
                ) {
                  return "30px";
                } else if (
                  d.data.has_assigned_siblings === true ||
                  d.data.has_unassigned_siblings === true
                ) {
                  return "30px";
                } else {
                  return "0px";
                }
              }
            })
            .attr("height", function (d) {
              if (d.data.name === "Unassigned") {
                if (
                  d.data.rankName === "realm" &&
                  d.data.taxNodeID !== "legend"
                ) {
                  return "30px";
                } else if (
                  d.data.has_assigned_siblings === true ||
                  d.data.has_unassigned_siblings === true
                ) {
                  return "30px";
                } else {
                  return "0px";
                }
              }
            })
            .attr("dx", settings.node.textDx)
            .attr("dy", settings.node.textDy)
            .style("fill", function (d) {
              let color = getRankColor(!!d._children, d.data.rankName);
              if (!!color) {
                return color;
              }

              findParent(d);
            })
            .attr("cursor", "pointer");

          Update.select("circle.node")
            .attr("r", function (d) {
              if (d.data.name !== "Unassigned") {
                return settings.node.radius;
              } else {
                return 0;
              }
            })
            .style("fill", function (d) {
              let color = getRankColor(!!d._children, d.data.rankName);
              if (!!color) {
                return color;
              }

              findParent(d);
            })
            .attr("cursor", "pointer")
            .text(function (d, i) {
              if (d.data.name === "Unassigned" || d.data.rankName === "tree") {
                if (d.data.taxNodeID === "legend") {
                  return d.data.rankName;
                } else if (
                  d.data.rankName === "realm" ||
                  d.data.has_unassigned_siblings === true
                ) {
                  // TEST
                  return "";
                  //return "Unassigned";
                } else {
                  return "";
                }
              } else {
                return d.data.name;
              }
            })
            .attr("fill", function (d) {
              if (d.data.rankName === "genus" && genus == true) {
                return "blue";
              }

              return "#000000";
            });

          // TODO: isn't this redundant?
          /*Update.select('circle.node')
                        .attr('r', function (d) {
                            if (d.data.name !== null) {
                                return settings.node.radius;
                            } else {
                                return 0;
                            }
                        })
                        .style("fill", function (d) {
                            
                            let color = getRankColor(!!d._children, d.data.rankName);
                            if (!!color) { return color; }

                            findParent(d);
                        }); */
          // Update.select('text')

          // .attr("transform", function (d, i) {
          //     if ((d.data.name === null) || d.data.rankName === "tree") {
          //         if (d.data.taxNodeID === "legend" && d.data.rankName !== "subgenus") {
          //             return "rotate(-45 150,-100)";
          //         } else if (d.data.taxNodeID === "legend" && d.data.rankName === "subgenus") {
          //             return "rotate(-45 150, -100) ";
          //         } else {
          //             return "";
          //         }

          //     }
          // })

          // .style("fill", function (d) {

          //     if (d.data.taxNodeID !== 'legend') {
          //         if(selected==d.data.name ){
          //         return d._children ? "#000000" : "#006CB5"
          //     }
          //     else{
          //         return "#000000"
          //     }
          // }
          //     findParent(d)

          // })
          var font;

          // .attr('cursor', 'pointer')

          Update.select("text.node-text")
            .attr("cursor", "pointer")
            .style("fill", function (d) {
              if (selected == d.data.name) {
                return d._children ? "#000000" : "#006CB5";
              } else {
                return "#000000";
              }
            })
            .style("font-size", slider.property("value") + "rem");
          // Transform
          Update.select("text.legend-node-text")
            .attr("transform", function (d, i) {
              if (d.data.taxNodeID === "legend") {
                return "rotate(-45 0,-110)";
              }
            })
            .style("fill", function (d) {
              findParent(d);
            });

          var Exit = children
            .exit()
            .transition()
            .duration(settings.animationDuration)
            .attr("transform", function (d) {
              return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

          Exit.select("circle").attr("r", 1);

          Exit.select("text").style("fill-opacity", 1);

          var link = svg.selectAll("path.link").data(links, function (d) {
            return d.id;
          });

          var linkEnter = link
            .enter()
            .insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
              if (
                ((d.data.rankName === "subgenus" &&
                  d.data.name == "Unassigned") ||
                  d.data.taxNodeID === "legend") &&
                d.data.name === "Unassigned"
              ) {
                return diagonal(0, 0);
              }
              var pos = { x: source.x0, y: source.y0 };
              return diagonal(pos, pos);
            })
            .style("stroke-width", "4px")
            .style("fill", "none")
            .style("stroke", "#ccc")
            .style("display", function (d) {
              if (
                d.depth === 1 ||
                (d.data.has_species === 0 &&
                  d.data.name == "Unassigned" &&
                  d.data.children === null) ||
                d.data.taxNodeID === "legend"
              ) {
                //Is top link
                return "none";
              }
            });
          var linkUpdate = linkEnter.merge(link);
          linkUpdate
            .transition("path.link")
            .duration(settings.animationDuration)
            .attr("d", function (d) {
              return diagonal(d, d.parent);
            })
            .style("stroke", function (d) {
              if (d.data.name !== "down" || d.data.name !== "up") {
                return d._children ? "#808080" : "#006CB5";
              }
              findParent(d);
            });
          // .attr('cursor', 'pointer');

          var linkExit = link
            .exit()
            .transition()
            .duration(settings.animationDuration)
            .attr("d", function (d) {
              var pos = { x: source.x, y: source.y };
              return diagonal(pos, pos);
            })
            .remove();

          parent.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
          });

          function diagonal(s, t) {
            // Validate s and t
            if (
              !s ||
              !t ||
              isNaN(s.x) ||
              isNaN(s.y) ||
              isNaN(t.x) ||
              isNaN(t.y)
            )
              return null;

            path = `M ${s.y} ${s.x}
                                C ${(s.y + t.y) / 2} ${s.x},
                                ${(s.y + t.y) / 2} ${t.x},
                                ${t.y} ${t.x}`;

            return path;
          }

          var simulation = d3
            .forceSimulation()
            .force("link", d3.forceLink().distance(500).strength(0.1));

          function findParent(par) {
            if (par.depth < 2) {
              return par.data.name;
            } else {
              return findParent(par.parent);
            }
          }

          function findParentLinks(par) {
            if (par.target.depth < 2) {
              return par.target.name;
            } else {
              return findParent(par.target.parent);
            }
          }

          function click(event, d) {
            selected = d.data.name;
            if (d.data.taxNodeID !== "legend") {
              if (d.hasOwnProperty("page")) {
                d.parent.children = d.parent.pages[d.page];
              } else if (d.children) {
                d._children = d.children;
                d.children = null;
              } else {
                d.children = d._children;
                d._children = null;
              }

              update(d);
            }
          }
          var div = d3
            .select(containerSelector)
            .append("div")
            // .transition()
            // .delay(1000)
            .attr("class", "tooltip");

          function showTooltip(e, d) {
            var c = d.data.child_counts;
            if (d.data.taxNodeID !== "legend" && d.data.rankName !== "tree") {
              // dmd 01/31/23 Replaced "body" with containerSelector.
              d3.select(containerSelector).selectAll("div.tooltip").remove();
              toolTip = true;
              // dmd 01/31/23 Replaced "body" with containerSelector, replaced "event" with "e".
              var div = d3
                .select(containerSelector)
                .append("div")
                // .transition()
                // .delay(1000)
                .attr("class", "tooltip")
                .style("opacity", 1)
                .style("left", e.pageX + settings.tooltipOffsetX + "px")
                .style("top", e.pageY + settings.tooltipOffsetY + "px")
                .html(
                  "<table style='font-size: 12px; font-family: sans-serif;' >" +
                    "<tr><td>Rank Name: </td><td>" +
                    d.data.rankName +
                    "</td></tr>" +
                    "<tr><td>Child count: </td><td>" +
                    c +
                    "</td></tr>" +
                    '<a href="https://ictv.global/taxonomy/taxondetails?taxnode_id=' +
                    d.data.taxNodeID +
                    '" target=_blank>' +
                    d.data.name +
                    "</a>" +
                    "</table>"
                );
            }
          }

          //  dmd 02/08/23 Not used
          function mousemove(d) {
            // dmd 01/31/23 Replaced "body" with containerSelector.
            // d3.select(tooltip).transition().delay(1000);
            console.log("Hi");
          }

          function hideTooltip(d) {
            // dmd 01/31/23 Replaced "body" with containerSelector
            // dmd 02/08/23 Removed the transition delay
            //d3.select(containerSelector).selectAll('div.tooltip').transition().remove();
            // d3.select(containerSelector).selectAll("div.tooltip")

            // if(toolTip===true){
            //   d3.select(containerSelector).selectAll("div.tooltip")

            //   .style("display", "none");
            // }
            toolTip = false;
            setTimeout(function () {
              if (!toolTip) {
                d3.select(containerSelector)
                  .selectAll("div.tooltip")
                  .style("display", "none");
              }
            }, 2000);
          }
        }
      }

      /*
            function add(e, d) {
                d3.select('.vanish').remove('div')

                var div = d3.select(`${containerSelector} .species-panel`).append("div").attr("class", "vanish")
                //var div = d3.select('.species').attr("width", width).append("div").attr("class", "vanish")
                d3.select('.vanish').append("h1").text("");

                var name = []
                if (d.data.rankName === "genus" || "subgenus") {

                    d3.json(speciesFilename).then(function (species) {
                        const sp = d3.hierarchy(species, function (s) {
                            return s.children;
                        })
                        console.log("species", sp)
                        console.log(species[d.data.taxNodeID])
                        var x = species[d.data.taxNodeID]
                        console.log(x[0].name)
                        x.forEach(row => {
                            console.log(row.name)
                            name.push(row.name)
                        })
                        d3.select('.vanish').append("h4").text(`Species of ${d.data.name}`)
                        x = d.data.taxNodeID;

                        div.selectAll('span')
                            .style('font-size', "4px")
                            .style('font-style', "italic")
                            .attr('fill', function (d, i) {
                                if (d.data.rankName === 'species') {
                                    return "#006CB5";
                                }
                            })
                            .data(name)
                            .enter()
                            .append('span')
                            .text(function (d, i) {
                                console.log("hi")
                                return d;
                            })
                            .on('click', function (d) {
                                console.log('open tab')
                                window.open(
                                    `${taxonDetailsURL}?taxnode_id=${x}`,
                                    '_blank'
                                );
                            })
                            .append('br')
                            .transition("duration", 5);
                    })
                }

            }*/
    });
  }
};
