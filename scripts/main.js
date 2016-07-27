var width = 960,
    height = 500;

var fill = d3.scale.category10();

var n = 100;
var nodes = d3.range(n).map(function (i) {
    return {
        index: i,
        "name": "N" + Math.round(Math.random() * 1000)
    };
});

//var links = d3.range(n).map(function(d) { return {source: nodes[Math.floor(Math.random()*n)], target: nodes[Math.floor(Math.random()*n)]}; });
var links = [{
        source: nodes[5],
        target: nodes[10]
    },
    {
        source: nodes[10],
        target: nodes[19]
    }];

var diagonal = d3.svg.diagonal().projection(function (d) {
    return [d.x, d.y];
});

var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .on("tick", tick)
    .start();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("cx", function (d) {
        return d.x;
    })
    .attr("cy", function (d) {
        return d.y;
    })
    .attr("r", 8)
    .style("fill", function (d, i) {
        return fill(i & 3);
    })
    .style("stroke", function (d, i) {
        return d3.rgb(fill(i & 3)).darker(2);
    })
    .call(force.drag)
    .on("mousedown", function () {
        d3.event.stopPropagation();
    });

var link = svg.selectAll(".link")
    .data(links)
    .enter().append("path")
    .attr("class", "link")
    .style("stroke", function (d, i) {
        return fill(i & 3);
    });

svg.style("opacity", 1e-6)
    .transition()
    .duration(1000)
    .style("opacity", 1);

d3.select("body")
    .on("mousedown", mousedown);


/*
setTimeout(function() {
	force.start();
	for (var i = n*n*n; i > 0; --i)
		force.tick();
	force.stop();
	
	// Push different nodes in different directions for clustering.
	  var k = 8 * e.alpha;
	  nodes.forEach(function(o, i) {
	    o.y += k;
	    o.x += i & 2 ? (i%2 +1)*k : (i%2 +1)*-k;
	  });

	  node.attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; });
}, 10);
*/

function tick(e) {

    // Push different nodes in different directions for clustering.
    var k = 8 * e.alpha;
    nodes.forEach(function (o, i) {
        o.y += k;
        o.x += i & 2 ? (i % 2 + 1) * k : (i % 2 + 1) * -k;
    });

    node.attr("cx", function (d) {
            return d.x;
        })
        .attr("cy", function (d) {
            return d.y;
        });

    link.attr("d", diagonal);
}

function mousedown() {
    nodes.forEach(function (o, i) {
        o.x += (Math.random() - .5) * 40;
        o.y += (Math.random() - .5) * 40;
    });
    force.resume();
}