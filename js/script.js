var years = ["--Select Year--", "1998", "2000", "2021", "2022", "New"]
var dropDown = d3.select("#years")
    .append("select")
    .attr("class", "selection")
    .attr("name", "Years")
    .on("change", change);
var options = dropDown.selectAll("option")
    .data(years)
    .enter()
    .append("option");
options.text(function (d, i) {
    // console.log(d)
    return (d)
})

function change(e, d) {
    d3.select('.non').remove('div');
    d3.select('.color').append('div').attr("class", "non")
    var x = "data/" + e.target.value + ".json";
    console.log(x);
    d3.json(x).then(function (data) {
        console.log(data)


        var k = 0;
        var flag = false;
        var trigger = "";
        var xt = "";
        var genus = false;
        var n = 0;
        var p = 0;
        var c = 0;
        var o = 0;
        var f = 0;
        var g = 0;
        var r = 0;
        var x1 = 0;
        var dm = 0;
        var id = 0;
        var r = 0;
        var rank = 0;
        var text;
        var order = true;
        let l = 0;
        var margin = {top: 50, right: 90, bottom: 50, left: 90};
        width = 1800 - margin.left - margin.right,
            height = $(window).height() - margin.top - margin.bottom;

        function handleZoom(e) {
            d3.select('svg g')
                .attr('transform', e.transform)

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
            current.attr("transform", "translate(" + x + "," + y + ")");

        }

        function dragend(d) {
            d.fixed = false

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
        var dropDown = d3.select("#years")
            .append("div")
            .attr("class", "selection")
            .attr("name", "Years")
            .selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .text(function (d, i) {

                return (d.data.rankName);
            })
            .attr('dx', function (d) {
                return d.x;
            })
            .attr('dy', function (d) {
                return d.data.rankIndex;
            })
        var i = 0;
        var duration = 900;

        function tree(ds) {
            var svg = d3.select(".non").append("svg")
                .attr("width", (width + margin.right + margin.left) * 0.6)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate("
                    + margin.left + "," + margin.top + ")")

            var layoutRoot = svg
                .append("svg:g")
                .attr("class", "color");

            d3.select("svg")

                .call(zoom)
                .on("dblclick.zoom", null);

            var div = d3.select("#legend").append('div');
            div.selectAll("h2").data(ds).enter().append("h2");
            div.text(function (d, i) {

                console.log(ds.children[i].data.rankName, i);


            })


            var tree = d3.tree().size([height, width]);

            ds.x0 = height / 4;
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

            function expand(d) {

            }

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

                    d.x = d.x * 5;
                    d.y = (d.data.rankIndex) * 550 + 500;

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
                    .on("mousemove", function (d) {
                        mousemove(d);
                    })
                    .on("mouseout", mouseout);

                Enter.append('rect')
                
                    
                    .style("stroke", "black")
                    .style("stroke-width", "2px")
                    .attr("width", function (d) {
                        if (d.data.name === null) {
                            if (d.data.rankName === "realm" && d.data.taxNodeID !== "legend") {

                                return "25px";
                            } else if (d.data.has_assigned_siblings === true || d.data.has_unassigned_siblings === true) {

                                return "25px";


                            } else {
                                return "0px"
                            }
                        }

                    })

                    .attr("height", function (d) {
                        if (d.data.name === null) {
                            if (d.data.rankName === "realm" && d.data.taxNodeID !== "legend") {

                                return "25px";
                            } else if (d.data.has_assigned_siblings === true && d.data.has_unassigned_siblings === true) {

                                return "25px";


                            } else {
                                return "0px"
                            }
                        }
                    })
                    
                    .style("fill", function (d) {
                            return d._children ? "	#fff" : "#006600"
                        findParent(d)
                    })
                    .attr('cursor', 'pointer');

                Enter.append('circle')
                    .attr('class', 'node')
                    .attr('r', function (d) {
                        if (d.data.name !== null) {
                            return 12;
                        } else {
                            return "0px"
                        }
                    })
                    .style("stroke","black")
                    .style("stroke-width","3px")
                    .style("fill", function (d) {
                            return d._children ? "	#fff" : "#006600"
                        findParent(d)
                    })
                    .style("opacity", function (d) {
                        return !d.data.parentDistance ? 0 : 1;
                    })
                    .style("pointer-events", function (d, i) {
                        return !d.data.parentDistance ? "none" : "all";
                    })

                Enter.append('text')
                    .attr("class", "print")
                    .attr("dy", '7')
                    .attr('dx', '20')
                    .attr("text-align", "right")

                    .attr("x", function (d, i) {
                        if (d.data.rankName !== "subgenus") {
                            return d.children || d._children ? -10 : 10;
                        } else if (d.data.rankname === "subgenus") {
                            return d.children || d._children ? 10 : -10;
                        }
                    })
                    .attr("text-anchor", function (d) {
                        if (d.data.rankName !== "subgenus") {
                            return d.children || d._children ? "end" : "start";
                        } else if (d.data.rankname === "subgenus") {
                            return d.children || d._children ? "start" : "end";
                        }
                    })
                    .style("font-size", "50px")
                    .style("font-weight", "bold")
                    .style("font-family", "Poppins")
                    .style("font-style","Italic")
                    .attr("dx", "-20")
                    .attr("dy", "10")
                    .text(function (d, i) {
                        if ((d.data.name === null) || d.data.rankName === "tree") {
                            if (d.data.taxNodeID === "legend") {
                                return d.data.rankName;
                            } else if (d.data.rankName === 'realm') {
                                return "Unassigned";
                            } else {
                                return ""
                            }

                        } else {
                            return (d.data.name);
                        }
                        ;
                    })
                    .attr("fill", function (d) {
                        return "#000000";
                    })
                    .on('click', add)

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

                                return "25px";
                            } else if (d.data.has_assigned_siblings === true || d.data.has_unassigned_siblings === true) {

                                return "25px";


                            } else {
                                return "0px"
                            }
                        }
                    })
                    .attr("height", function (d) {
                        if (d.data.name === null) {
                            if (d.data.rankName === "realm" && d.data.taxNodeID !== "legend") {

                                return "25px";
                            } else if (d.data.has_assigned_siblings === true || d.data.has_unassigned_siblings === true) {

                                return "25px";


                            } else {
                                return "0px"
                            }
                        }
                    })
                    .style("fill", function (d) {


                        if (d.data.rankName === "realm") {
                            return d._children ? "	#fff" : "#006600"
                        } else if (d.data.rankName === "subrealm") {
                            return d._children ? "	#fff" : "#006600"
                        } else if (d.data.rankName === "kingdom") {
                            return d._children ? "#fff" : "#278627";
                        } else if (d.data.rankName === "subkingdom") {
                            return d._children ? "#fff" : "#278627";
                        } else if (d.data.rankName === "phylum") {
                            return d._children ? "#fff" : "#00426D";
                        } else if (d.data.rankName === "subphylum") {
                            return d._children ? "#fff" : "#00426D";
                        } else if (d.data.rankName === "class") {
                            return d._children ? "#fff" : "#3D79AA";
                        } else if (d.data.rankName === "subclass") {
                            return d._children ? "#fff" : "#3D79AA";
                        } else if (d.data.rankName === "order") {
                            return d._children ? "#fff" : "#006CB5";
                        } else if (d.data.rankName === "suborder") {
                            return d._children ? "#fff" : "#006CB5";
                        } else if (d.data.rankName === "family") {
                            return d._children ? "#fff" : "#258DE4";
                        } else if (d.data.rankName === "subfamily") {
                            return d._children ? "#fff" : "#258DE4";
                        } else if (d.data.rankName === "genus") {
                            return d._children ? "#fff" : "#99D7FF";
                        } else if (d.data.rankName === "subgenus") {
                            return d._children ? "#fff" : "#99D7FF";
                        } else if (d.data.rankName === "Species") {
                            return d._children ? "#fff" : "#D1EDFF";
                        }
                        findParent(d)

                    })
                    .attr('cursor', 'pointer');

                Update.select('circle.node')
                    .attr('r', function (d) {

                        if (d.data.name !== null) {
                            return 5
                        } else {
                            return "0px"
                        }
                    })
                    .style("fill", function (d) {

                        if (d.data.rankName === "realm") {
                            return d._children ? "	#fff" : "#006600"
                        } else if (d.data.rankName === "subrealm") {
                            return d._children ? "	#fff" : "#006600"
                        } else if (d.data.rankName === "kingdom") {
                            return d._children ? "#fff" : "#278627";
                        } else if (d.data.rankName === "subkingdom") {
                            return d._children ? "#fff" : "#278627";
                        } else if (d.data.rankName === "phylum") {
                            return d._children ? "#fff" : "#00426D";
                        } else if (d.data.rankName === "subphylum") {
                            return d._children ? "#fff" : "#00426D";
                        } else if (d.data.rankName === "class") {
                            return d._children ? "#fff" : "#3D79AA";
                        } else if (d.data.rankName === "subclass") {
                            return d._children ? "#fff" : "#3D79AA";
                        } else if (d.data.rankName === "order") {
                            return d._children ? "#fff" : "#006CB5";
                        } else if (d.data.rankName === "suborder") {
                            return d._children ? "#fff" : "#006CB5";
                        } else if (d.data.rankName === "family") {
                            return d._children ? "#fff" : "#258DE4";
                        } else if (d.data.rankName === "subfamily") {
                            return d._children ? "#fff" : "#258DE4";
                        } else if (d.data.rankName === "genus") {
                            return d._children ? "#fff" : "#99D7FF";
                        } else if (d.data.rankName === "subgenus") {
                            return d._children ? "#fff" : "#99D7FF";
                        } else if (d.data.rankName === "Species") {
                            return d._children ? "#fff" : "#D1EDFF";
                        }
                        findParent(d)

                    })
                    .attr('cursor', 'pointer')
                    .text(function (d, i) {
                        if ((d.data.name === null) || d.data.rankName === "tree") {
                            if (d.data.taxNodeID === "legend") {
                                return d.data.rankName;
                            } else if (d.data.rankName === 'realm') {
                                return "Unassigned";
                            } else {
                                return ""
                            }

                        } else {
                            return (d.data.name);
                        }
                        ;
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
                            return 12;
                        } else {
                            return "0px"
                        }
                    })
                    .style("fill", function (d) {
                        if (d.data.rankName === "realm") {
                            return d._children ? "	#fff" : "#006600"
                        } else if (d.data.rankName === "subrealm") {
                            return d._children ? "	#fff" : "#006600"
                        } else if (d.data.rankName === "kingdom") {
                            return d._children ? "#fff" : "#278627";
                        } else if (d.data.rankName === "subkingdom") {
                            return d._children ? "#fff" : "#278627";
                        } else if (d.data.rankName === "phylum") {
                            return d._children ? "#fff" : "#00426D";
                        } else if (d.data.rankName === "subphylum") {
                            return d._children ? "#fff" : "#00426D";
                        } else if (d.data.rankName === "class") {
                            return d._children ? "#fff" : "#3D79AA";
                        } else if (d.data.rankName === "subclass") {
                            return d._children ? "#fff" : "#3D79AA";
                        } else if (d.data.rankName === "order") {
                            return d._children ? "#fff" : "#006CB5";
                        } else if (d.data.rankName === "suborder") {
                            return d._children ? "#fff" : "#006CB5";
                        } else if (d.data.rankName === "family") {
                            return d._children ? "#fff" : "#258DE4";
                        } else if (d.data.rankName === "subfamily") {
                            return d._children ? "#fff" : "#258DE4";
                        } else if (d.data.rankName === "genus") {
                            return d._children ? "#fff" : "#99D7FF";
                        } else if (d.data.rankName === "subgenus") {
                            return d._children ? "#fff" : "#99D7FF";
                        } else if (d.data.rankName === "Species") {
                            return d._children ? "#fff" : "#D1EDFF";
                        }
                        findParent(d)

                    })
                Update.select('text.print')

                    .attr("transform", function (d, i) {
                        if ((d.data.name === null) || d.data.rankName === "tree") {
                            if (d.data.taxNodeID === "legend" && d.data.rankName !== "subgenus") {
                                return "rotate(-45 -10,10)";
                            } else if (d.data.taxNodeID === "legend" && d.data.rankName === "subgenus") {
                                return "rotate(-45 -50, 100) ";
                            } else {
                                return "";
                            }

                        }
                    })
                    .clone(true).lower()
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-width", 10)
                    .attr("stroke", "white")


                    .style("fill", function (d) {
                            return d._children ? "#000000" : "#006CB5"
                        findParent(d)

                    })
                    .attr('cursor', 'pointer')


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
                            return diagonal(0, 0)
                        }
                        var pos = {x: source.x0, y: source.y0}
                        return diagonal(pos, pos)
                    })
                    .style("fill","none")
                    .style("stroke-width","2px")
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
                        if (d.data.rankName === "realm") {
                            return d._children ? "#808080" : "#006CB5"
                        } else if (d.data.rankName === "subrealm") {
                            return d._children ? "#808080" : "#006CB5"
                        } else if (d.data.rankName === "kingdom") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "subkingdom") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "phylum") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "subphylum") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "class") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "subclass") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "order") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "suborder") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "family") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "subfamily") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "genus") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "subgenus") {
                            return d._children ? "#808080" : "#006CB5";
                        } else if (d.data.rankName === "Species") {
                            return d._children ? "#fff" : "#D1EDFF";
                        }
                        findParent(d)

                    })


                    .attr('cursor', 'pointer')
                var linkExit = link.exit().transition()
                    .duration(duration)
                    .attr('d', function (d) {
                        var pos = {x: source.x, y: source.y}
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
                ${t.y} ${t.x}`

                    return path

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
                    console.log(d.data.name)
                    var test = d.data.name;
                    var c = d.data.child_counts;
                    var div = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 1)
                        .style("left", (event.pageX + 70) + "px")
                        .style("top", (event.pageY) + "px")

                        .html(
                            "<table style='font-size: 12px; font-family: sans-serif;' >" +
                            "<tr><td>Rank Name: </td><td>" + d.data.rankName + "</td></tr>" +
                            "<tr><td>Child count: </td><td>" + c + "</td></tr>" +

                            "</table>"
                        )
                }

                function mousemove(d) {
                    d3.select("body").selectAll('div.tooltip').style("opacity", 1);
                }

                function mouseout(d) {
                    d3.select("body").selectAll('div.tooltip').remove();
                }

            }
        }

        function add(e, d) {
            d3.select('.vanish').remove('div')
            var div = d3.select('.species').attr("width", width).append("div").attr("class", "vanish")
            d3.select('.vanish').append("h1").text("")
            var name = []
            if (d.data.rankName === "genus" || "sub genus") {
                d3.json("species.json").then(function (species) {
                    const sp = d3.hierarchy(species, function (s) {
                        return s.children
                    })
                    console.log("species", sp)
                    console.log(species[d.data.taxNodeID])
                    var x = species[d.data.taxNodeID]
                    console.log(x[0].name)
                    x.forEach(row => {
                        console.log(row.name)
                        name.push(row.name)
                    })
                    d3.select('.vanish').append("h2").text("Species of" + "  " + d.data.name)
                    div.selectAll('span')
                        .style('font-size', "15px")
                        .style('font-style', "italic")
                        .attr('fill', function (d, i) {
                            if (d.data.rankName === 'species') {
                                return "#99D7FF";
                            }
                        })

                        .data(name)
                        .enter()
                        .append('span')
                        .text(function (d, i) {
                            console.log("hi")
                            return d
                        })
                        .append('br')
                        .transition("duration", 5);
                })
            }

        }


    });
}
