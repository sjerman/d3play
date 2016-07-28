
// Define the dimensions of the visualization. We're using
// a size that's convenient for displaying the graphic on
// http://jsDataV.is

var width = 640,
    height = 480;

// Here's were the code begins. We start off by creating an SVG
// container to hold the visualization. We only need to specify
// the dimensions for this container.

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);


var fill = d3.scale.category10();
var statusCodes = {'ok': '#109618', 'warning': '#ff9900', 'error': '#dc3912'}
	
//Add a Loading message in the middle of the screen
var loading = svg.append("text").attr("x", width / 2).attr("y", height / 2)
.attr("dy", ".35em").style("text-anchor", "middle").text(
		"Loading the network topology for the selected timeframe.. Hang tight.. ");

//Initialize the uber graph data object, which will be populated by the API call. 
var graph = {
	"nodes": [], "links": []
};

var snapshots = [];
//Make a request to the server to get the data
d3.json("data/metadata.json", function(error, json) {
	if (error) return console.warn(error);
	graph.nodes = json["node_meta"];
	$.each(json["link_meta"], function(i, obj) {
		var s = filterByAttribute(graph.nodes, "id", obj["from"]);
		var t = filterByAttribute(graph.nodes, "id", obj["to"]);
		graph.links.push({
			"source": s, "target": t, "id": obj["id"], "active": false
		});
	});
	snapshots = json["history"];
	visualizeit();
});

var NODE, LINK;

//Entry point point for visualizing the graph. By this time the data is all there and loaded from the server
function visualizeit() {
	
	// Extract the nodes and links from the data.
	var nodes = graph.nodes,
	    links = graph.links;

	var diagonalLine = d3.svg.diagonal()
						.projection(function(d) {
							return [d.x, d.y]; 
						});
	
	var typeCountData = d3.nest()
					.key(function(d) { return d.type; })
					.rollup(function(list) { return list.length; })
					.map(nodes);
	writeToScreen(JSON.stringify(typeCountData));
	
	var wlcPosScale = d3.scale.linear().range([Math.floor((-1*(typeCountData["wlc"]+1)/2)+1), Math.floor(1*typeCountData["wlc"]/2)]).domain([0,typeCountData["wlc"]-1]);
	var apPosScale = d3.scale.linear().range([Math.floor((-1*(typeCountData["ap"]+1)/2)+1), Math.floor(1*typeCountData["ap"]/2)]).domain([0,typeCountData["ap"]-1]);
	var clientPosScale = d3.scale.linear().range([Math.floor((-1*(typeCountData["client"]+1)/2)+1), Math.floor(1*typeCountData["client"]/2)]).domain([0,typeCountData["client"]-1]);
	writeToScreen(apPosScale(0));

	// Next we'll add the nodes and links to the visualization.
	// Note that we're just sticking them into the SVG container
	// at this point. We start with the links. The order here is
	// important because we want the nodes to appear "on top of"
	// the links. SVG doesn't really have a convenient equivalent
	// to HTML's `z-index`; instead it relies on the order of the
	// elements in the markup. By adding the nodes _after_ the
	// links we ensure that nodes appear on top of links.

	// Links are pretty simple. They're just SVG lines, and
	// we're not even going to specify their coordinates. (We'll
	// let the force layout take care of that.) Without any
	// coordinates, the lines won't even be visible, but the
	// markup will be sitting inside the SVG container ready
	// and waiting for the force layout.

	LINK = svg.selectAll('.link')
	    .data(links)
	    .enter().append('path')
	    .attr('class', 'link')
	    .classed('green', function(d) {
			return d.active;
		})
		.on("mouseover", function(d) { d3.select(this).style('stroke-width', 3); })
	    .on("mouseout", function(d) { d3.select(this).style('stroke-width', 1); });

	// Now it's the nodes turn. Each node is drawn as a circle.

	NODE = svg.selectAll('.node')
	    .data(nodes)
	    .enter().append('circle')
	    .attr('class', function(d) {
	    	return "node "+d.type;
	    })
	    .style("fill", function(d, i) {
	    	if(!d.status) {
	    		return "#ccc";
	    	} else {
	    		return statusCodes[d.status];
	    	} 
	    })
	    .attr('r', 6)
	    .on("mouseover", function(d) { d3.select(this).attr('r', 12); })
	    .on("mouseout", function(d) { d3.select(this).attr('r', 6); });


	//Remove the Loading message
	loading.remove();
	
    // When this function executes, the force layout
    // calculations have concluded. The layout will
    // have set various properties in our nodes and
    // links objects that we can use to position them
    // within the SVG container.

    // First let's reposition the nodes. As the force
    // layout runs it updates the `x` and `y` properties
    // that define where the node should be centered.
    // To move the node, we set the appropriate SVG
    // attributes to their new values. Also give the
    // nodes a non-zero radius so they're visible.
	
	var clientNodes = NODE.filter(function(d) {
        return d.type=="client";
    });
	var apNodes = NODE.filter(function(d) {
        return d.type=="ap";
    });
	var wlcNodes = NODE.filter(function(d) {
        return d.type=="wlc";
    });
	
	wlcNodes.attr('cx', function(d, i) {
	    	console.log(i);
	    	var x = width/2 - (wlcPosScale(i))*100;
	    	d.x = x;
	    	return d.x;
	    })
	    .attr('cy', function(d, i) {
	    	var y = height-3*(height/4);
	    	d.y = y;
	    	return d.y;
	    });
	
	apNodes.attr('cx', function(d, i) {
        	console.log(i);
        	var x = width/2 - (apPosScale(i))*100;
        	d.x = x;
        	return d.x;
        })
        .attr('cy', function(d, i) {
        	var y = height-2*(height/4);
        	d.y = y;
        	return d.y;
        });
	
	clientNodes.attr('cx', function(d, i) {
	    	console.log(i);
	    	var x = width/2 - (clientPosScale(i))*100;
	    	d.x = x;
	    	return d.x;
	    })
	    .attr('cy', function(d, i) {
	    	var y = height-1*(height/4);
	    	d.y = y;
	    	return d.y;
	    });

	LINK.attr("d", diagonalLine);
	
}

function updateStatus() {
	var rand = Math.floor(snapshots.length*Math.random());
	writeToScreen("Random history data point : "+rand);
	var snapshot = snapshots[rand];
	$.each(graph.nodes, function(i,n) {
		n.status = null;
		$.each(snapshot.nodes, function(j,sn) {
			if(sn.id==n.id) {
				n.status = sn.status;
				return false;
			}
		});
	});
	
	$.each(graph.links, function(i,l) {
		l.active = false;
		$.each(snapshot.links, function(j,sn) {
			if(sn.id==l.id) {
				l.active = true;
				return false;
			}
		});
	});
	
	NODE.style("fill", function(d, i) {
    	if(!d.status) {
    		return "#ccc";
    	} else {
    		return statusCodes[d.status];
    	} 
    }).attr('r', function(d) { 
    	return d.status? 12 : 6;
    });
	
	LINK.classed('green', function(d) {
		return d.active;
	}).style('stroke-width', function(d) {
		return d.active? 3 : 1;
	});
}

//Simple filter function
function filterByAttribute(arr, key, value) {
	for(var i=0;i<arr.length;i++) {
		if(arr[i][key]==value) {
			return arr[i];
		}
	}
}

function writeToScreen(str) {
	$("#log").append(str+"<br>");
}
