
// Create the ICTV namespace if it doesn't already exist.
if (!window.ICTV) { window.ICTV = {}; }

window.ICTV.d3TaxonomyVisualization = function(containerSelector_, dataURL_, releases_, taxonDetailsURL_) {

    // Validate input parameters
    if (!containerSelector_) { throw new Error("Invalid container selector"); }
    const containerSelector = containerSelector_;

    if (!dataURL_) { throw new Error("Invalid data URL"); }
    const dataURL = dataURL_;

    if (!releases_) { throw new Error("Invalid releases"); }
    const releases = releases_;

    if (!taxonDetailsURL_) { throw new Error("Invalid taxon details URL"); }
    const taxonDetailsURL = taxonDetailsURL_;

    var selected;
    var dropDown = d3.select(`${containerSelector} .years`)
        .append("select")
        .attr("class", "selection")
        .attr("name", "Years")
        .on("change", change)
        .attr("values", function (d) {
            return;
        })

    var options = dropDown.selectAll("option")
        .data(releases)
        .enter()
        .append("option");
    options.text(function (d, i) {
        // console.log(d)
        return (d)
    })


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


    function change(e, d) {
        d3.select('.non').remove('div');
        d3.select('.color').append('div').attr("class", "non");

        let release = e.target.value;

        // If the first 2 characters are numeric, we will assume it's a valid release.
        if (isNaN(parseInt(release.substr(0,2)))) { return; }

        var nonSpeciesFilename = `${dataURL}/data/nonSpecies_${release}.json`;
        var speciesFilename = `${dataURL}/data/species_${release}.json`;
        
        d3.json(nonSpeciesFilename).then(function (data) {
            console.log(data)
            var genus = false;
            var x1 = 0;
            var margin = { top: 50, right: 90, bottom: 50, left: 90 };
            width = 2000 - margin.left - margin.right,
                height = jQuery(window).height() - margin.top - margin.bottom;

            function handleZoom(e) {
                d3.select('svg g')
                    .attr("transform", e.transform);
            }
            let zoom = d3.zoom()
                .on('zoom', handleZoom)

            var drag = d3.drag()
                .on("start", start)
                .on("drag", dragged)
                .on("end", dragend)

            function start(d) {
                d.fixed = true
            }

            function dragged() {
                var x = event.x;
                var y = event.y;
                var current = d3.select("svg g");
                current.attr("transform", `translate(${x},${y})`);

            }

            function dragend(d) {
                d.fixed = false;
            }

            const ds = d3.hierarchy(data, function (d) {
                if (d.children === null) {
                    console.log("NA")

                } else {
                    return d.children;
                }

            });
            console.log(ds);

            if (x1 === 0) {
                tree(ds);
                x1++;
            }
            
            var i = 0;
            var duration = 900;

            function tree(ds) {
                var svg = d3.select(".non").append("svg")
                    .attr("width", (width + margin.right + margin.left) * 0.6)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate("
                        + margin.left + "," + margin.top + ")")

                d3.select("svg")
                    .call(zoom.translateBy, "-3850", "-1800")
                    .call(zoom.scaleBy, "0.17")
                    .call(zoom)

                    .on("dblclick.zoom", null);


                var div = d3.select(`${containerSelector} .legend`).append('div');
                div.selectAll("h2").data(ds).enter().append("h2");
                div.text(function (d, i) {

                    console.log(ds.children[i].data.rankName, i);


                })


                var tree = d3.tree().size([height, width]);

                ds.x0 = (height / 4);
                ds.y0 = 0;

                function pageNodes(d, maxNode) {

                    if (d.children) {
                        d.children.forEach(c => pageNodes(c, maxNode));
                        if (d.children.length > maxNode) {
                            d.pages = {}
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
                                        rankIndex: "13"
                                    },
                                    page: i == 0 ? l - 1 : i - 1
                                })
                                d.pages[i].push({
                                    ...d.pages[i][0],
                                    data: {
                                        name: "Down",
                                        rankName: "Shift",
                                        rankIndex: "13"
                                    },
                                    page: i != (l - 1) ? i + 1 : 0,
                                });
                            }
                            d.children = d.pages[0];
                        }
                    }

                }

                ds.children.forEach(c => pageNodes(c, 50));
                ds.children.forEach(collapse);
                update(ds);


                function collapse(d) {

                    if (d.children) {

                        if (d.data.name === null && d.data.rankName === "realm" && d.data.taxNodeID !== "legend") {
                            d._children = d.children;
                            d._children.forEach(collapse);
                            d.children = null;
                        } else if (d.data.name === null && (d.data.has_assigned_siblings !== true && d.data.has_unassigned_siblings !== true)) {
                            console.log(d.data.parent);


                            for (var i = 0; i < 1; i++) {
                                var open = d.children[i];
                                d.children.forEach(collapse);

                            }
                            display = false;
                        } else {
                            if (d.data.has_assigned_siblings === true || d.data.has_unassigned_siblings === true) {
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

                    var info = tree(ds);
                    var parent = info.descendants(),
                        links = info.descendants().slice(1);

                    parent.forEach(function (d) {
                        d.x = d.x * 6;
                        d.y = (d.data.rankIndex) * 500 + 500;
                    });

                    var children = svg.selectAll('g.node')
                        .data(parent, function (d) {
                            return d.id || (d.id = ++i);
                        });

                    var Enter = children.enter().append('g')
                        .attr('class', 'node')
                        .attr("transform", function (d) {
                            return "translate(" + source.y0 + "," + source.x0 + ")";
                        })
                        .on('click', click)

                        .on("mouseover", mouseover)
                        .on("mouseout", mouseout);

                    Enter.append('rect')
                        .style("stroke", "black")
                        .style("stroke-width", "2px")
                        .attr("width", function (d) {
                            if (d.data.name === null) {
                                if (d.data.rankName === "realm" && d.data.taxNodeID !== "legend") {
                                    return "20px";
                                } else if (d.data.has_assigned_siblings === true || d.data.has_unassigned_siblings === true) {
                                    return "20px";
                                } else {
                                    return "0px"
                                }
                            }
                        })

                        .attr("height", function (d) {
                            if (d.data.name === null) {
                                if (d.data.rankName === "realm" && d.data.taxNodeID !== "legend") {
                                    return "15px";
                                } else if (d.data.has_assigned_siblings === true && d.data.has_unassigned_siblings === true) {
                                    return "15px";
                                } else {
                                    return "0px"
                                }
                            }
                        })
                        .style("fill", function (d) {

                            let color = getRankColor(!!d._children, d.data.rankName);
                            if (!!color) { return color; }

                            findParent(d);
                        })
                        .attr('cursor', 'pointer');

                    Enter.append('circle')
                        .attr('class', 'node')
                        .attr('r', function (d) {
                            if (d.data.name !== null) {
                                return 35;
                            } else {
                                return "0px"
                            }
                        })
                        .style("stroke", "black")
                        .style("stroke-width", "2.5px")
                        .style("fill", function (d) {

                            let color = getRankColor(!!d._children, d.data.rankName);
                            if (!!color) { return color; }

                            findParent(d);
                        })
                        .style("opacity", function (d) {
                            return !d.data.parentDistance ? 0 : 1;
                        })
                        .style("pointer-events", function (d, i) {
                            return !d.data.parentDistance ? "none" : "all";
                        })

                    function getBB(ds) {
                        ds.each(function (d) { d.bbox = this.getBBox(); })
                    }

                    Enter.append('text')
                        .attr("class", function (d) {
                            return d.data.taxNodeID === "legend" ? "legend-node-text" : "node-text";
                        })
                        .attr("dy", '7')
                        .attr('dx', '5')
                        .attr("x", function (d, i) {
                            if (d.data.rankName !== "subgenus") {
                                return d.children || d._children ? 10 : -10;
                            } else if (d.data.rankname === "subgenus") {
                                return d.children || d._children ? 10 : -10;
                            }
                        })
                        .attr("text-anchor", function (d) {
                            if (d.data.rankName !== "subgenus") {
                                return d.children || d._children ? "start" : "end";
                            }
                            else if (d.data.rankname === "subgenus") {
                                return d.children || d._children ? "start" : "end";
                            }
                        })
                        .attr("dx", "20")
                        .attr("dy", "10")
                        .text(function (d) {
                            if ((d.data.name === null) || d.data.rankName === "tree") {
                                if (d.data.taxNodeID === "legend") {
                                    return d.data.rankName;
                                } else if (d.data.rankName === 'realm' || d.data.has_assigned_siblings === true) {
                                    return "Unassigned";
                                } else {
                                    return ""
                                }
                            } else {
                                return (d.data.name);
                            }
                        })
                        .attr("fill", function (d) {
                            return "#000000";
                        })
                        .on('click', add)
                        .call(getBB);

                    Enter.insert("rect", "text")
                        .attr("x", function (d) { return d.bbox.x })
                        .attr("y", function (d) { return d.bbox.y })
                        .attr("width", function (d) { return d.bbox.width })
                        .attr("height", function (d) { return d.bbox.height })
                        .style("fill", "white");

                    var Update = Enter.merge(children);
                    Update.transition()
                        .duration(duration)
                        .attr("transform", function (d) {
                            return "translate(" + d.y + "," + d.x + ")";
                        });

                    Update.select('rect')
                        .style("stroke", "black")
                        .style("stroke-width", "1px")
                        .attr("width", function (d) {
                            if (d.data.name === null) {
                                if (d.data.rankName === "realm" && d.data.taxNodeID !== "legend") {
                                    return "15px";
                                } else if (d.data.has_assigned_siblings === true || d.data.has_unassigned_siblings === true) {
                                    return "15px";
                                } else {
                                    return "0px"
                                }
                            }
                        })
                        .attr("height", function (d) {
                            if (d.data.name === null) {
                                if (d.data.rankName === "realm" && d.data.taxNodeID !== "legend") {
                                    return "15px";
                                } else if (d.data.has_assigned_siblings === true || d.data.has_unassigned_siblings === true) {
                                    return "15px";
                                } else {
                                    return "0px"
                                }
                            }
                        })
                        .style("fill", function (d) {

                            let color = getRankColor(!!d._children, d.data.rankName);
                            if (!!color) { return color; }

                            findParent(d);
                        })
                        .attr('cursor', 'pointer');

                    Update.select('circle.node')
                        .attr('r', function (d) {

                            if (d.data.name !== null) {
                                return 25
                            } else {
                                return "0px"
                            }
                        })
                        .style("fill", function (d) {

                            let color = getRankColor(!!d._children, d.data.rankName);
                            if (!!color) { return color; }

                            findParent(d);
                        })
                        .attr('cursor', 'pointer')
                        .text(function (d, i) {
                            if ((d.data.name === null) || d.data.rankName === "tree") {
                                if (d.data.taxNodeID === "legend") {
                                    return d.data.rankName;
                                } else if (d.data.rankName === 'realm' || d.data.has_unassigned_siblings === true) {
                                    return "Unassigned";
                                } else {
                                    return ""
                                }
                            } else {
                                return (d.data.name);
                            }
                        })
                        .attr("fill", function (d) {
                            if (d.data.rankName === 'genus' && genus == true) {
                                return "blue";
                            }

                            return "#000000";
                        });

                    Update.select('circle.node')
                        .attr('r', function (d) {
                            if (d.data.name !== null) {
                                return "20px";
                            } else {
                                return "0px"
                            }
                        })
                        .style("fill", function (d) {
                            
                            let color = getRankColor(!!d._children, d.data.rankName);
                            if (!!color) { return color; }

                            findParent(d);
                        });

                    Update.select("text.node-text") 
                        .attr('cursor', 'pointer')
                        .style("fill", function (d) {
                            if (selected == d.data.name) {
                                return d._children ? "#000000" : "#006CB5";
                            } else {
                                return "#000000";
                            }   
                        });

                    // Transform 
                    Update.select("text.legend-node-text")
                        .attr("transform", function (d, i) {
                            if ((d.data.name === null) || d.data.rankName === "tree") {
                                return "rotate(-45 150,-100)";

                                /*if (d.data.taxNodeID === "legend" && d.data.rankName !== "subgenus") {
                                    return "rotate(-45 150,-100)";
                                } else if (d.data.taxNodeID === "legend" && d.data.rankName === "subgenus") {
                                    return "rotate(-45 150, -100) ";
                                } else {
                                    return "";
                                }
                                */
                            }
                        })
                        .style("fill", function (d) {
                            findParent(d)
                        })

                        // .clone(true).lower()
                        // .attr("stroke-linejoin", "round")
                        // .attr("stroke-width", 10)
                        // .attr("stroke", "white") 

                    var Exit = children.exit().transition()
                        .duration(duration)
                        .attr("transform", function (d) {
                            return "translate(" + source.y + "," + source.x + ")";
                        })
                        .remove();

                    Exit.select('circle')
                        .attr('r', 1);

                    Exit.select('text')
                        .style('fill-opacity', 1);

                    var link = svg.selectAll('path.link')
                        .data(links, function (d) {
                            return d.id;
                        });

                    var linkEnter = link.enter().insert('path', "g")
                        .attr("class", "link")
                        .attr('d', function (d) {
                            if (((d.data.rankName === "subgenus" && d.data.name == null) || d.data.taxNodeID === "legend") && d.data.name === null) {
                                return diagonal(0, 0);
                            }
                            var pos = { x: source.x0, y: source.y0 }
                            return diagonal(pos, pos)
                        })
                        .style("stroke-width", "2px")
                        .style("fill", "none")
                        .style("stroke", "#ccc")
                        .style("display", function (d) {
                            if (d.depth === 1 || (d.data.rankIndex === 14 && d.data.name == null) || d.data.taxNodeID === "legend") { //Is top link
                                return 'none';
                            }
                        });
                    var linkUpdate = linkEnter.merge(link);
                    linkUpdate.transition('path.link')
                        .duration(duration)
                        .attr('d', function (d) {
                            return diagonal(d, d.parent)
                        })

                        .style("stroke", function (d) {
                            if (d.data.name !== "down" || d.data.name !== "up") {
                                return d._children ? "#808080" : "#006CB5"
                            }
                            findParent(d);
                        })
                        .attr('cursor', 'pointer');

                    var linkExit = link.exit().transition()
                        .duration(duration)
                        .attr('d', function (d) {
                            var pos = { x: source.x, y: source.y }
                            return diagonal(pos, pos)
                        })
                        .remove();

                    parent.forEach(function (d) {
                        d.x0 = d.x;
                        d.y0 = d.y;
                    });

                    function diagonal(s, t) {
                        path = `M ${s.y} ${s.x}
                                C ${(s.y + t.y) / 2} ${s.x},
                                ${(s.y + t.y) / 2} ${t.x},
                                ${t.y} ${t.x}`;

                        return path;
                    }

                    var simulation = d3.forceSimulation()
                        .force("link", d3.forceLink().distance(500).strength(0.1));

                    function findParent(par) {
                        if (par.depth < 2) {
                            return par.data.name
                        } else {
                            return findParent(par.parent)
                        }
                    }

                    function findParentLinks(par) {
                        if (par.target.depth < 2) {
                            return par.target.name
                        } else {
                            return findParent(par.target.parent)
                        }
                    }

                    function click(event, d) {
                        selected = d.data.name;
                        console.log("Click", d.data.name)
                        if (d.hasOwnProperty('page')) {
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

                    function mouseover(e, d) {
                        var c = d.data.child_counts;
                        if (d.data.taxNodeID !== "legend" && d.data.rankName !== "tree") {

                            // dmd 01/31/23 Replaced "body" with containerSelector.
                            d3.select(containerSelector).selectAll('div.tooltip').remove();
                            
                            // dmd 01/31/23 Replaced "body" with containerSelector, replaced "event" with "e".
                            var div = d3.select(containerSelector).append("div")
                                .attr("class", "tooltip")
                                .style("opacity", 1)
                                .style("left", (e.pageX + 70) + "px")
                                .style("top", (e.pageY) + "px")
                                .html(`<table style='font-size: 12px; font-family: sans-serif;'>
                                    <tr><td>Rank Name: </td><td>${d.data.rankName}</td></tr>
                                    <tr><td>Child count: </td><td>${c}</td></tr>
                                    <a href="${taxonDetailsURL}?taxnode_id=${d.data.taxNodeID} target="_blank">${d.data.name}</a>
                                    </table>`
                                );
                        }
                    }

                    function mousemove(d) {
                        // dmd 01/31/23 Replaced "body" with containerSelector.
                        d3.select(containerSelector).transition().delay(1000);
                    }

                    function mouseout(d) {
                        // dmd 01/31/23 Replaced "body" with containerSelector.
                        d3.select(containerSelector).selectAll('div.tooltip').transition().delay(750).remove();
                    }
                }
            }

            function add(e, d) {
                d3.select('.vanish').remove('div')

                var div = d3.select('.species').attr("width", width).append("div").attr("class", "vanish")
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

            }


        });
    }
}
