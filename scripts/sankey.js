// My Queue
function Queue() {
	this.elements = []
}
Queue.prototype.push = function (x) {
	return this.elements.push(x)
}
Queue.prototype.pop = function () {
	return this.elements.shift()
}
Queue.prototype.size = function () {
	return this.elements.length
}

var chess = new Chess()
chess.reset()

var currMoves = []
Array.prototype.smash = function() {
	var res = ""
	for (var i = 0; i < this.length; i++) {
		res += this[i] + " "
	}
	return res.trim()
}
d3.select("#nextmove").on("keypress", function () {
	if (d3.event.keyCode === 13) {
		var success = chess.move(d3.event.target.value)
		// valid move made
		if (success !== null) {
			currMoves.push(d3.event.target.value.trim())
			updatePage(out)
		}
		// clear input
		d3.event.target.value = ""
	}
})
d3.select("#backmove").on("click", function () {
	var result = chess.undo()
	if (result !== null) {
		currMoves.splice(currMoves.length - 1)
		updatePage(out)
	}
})
d3.select("#filter").on("click", function () {
	var minrating = d3.select("#minrating")._groups[0][0].value
	var winner = d3.select("#winners")._groups[0][0].value
	var settings = {
		minrating: minrating,
		winner: winner
	}
	loadData(settings)
})


var body = d3.select("body")
// set the dimensions and margins of the graph
var x = 50
var y = -10
var width = body.style("width")
width = +width.substring(0, width.length - 2)
var height = body.style("height")
height = +height.substring(0, height.length - 2)

var updatePage = (data) => {
	var new_data = getTrimmedTree(currMoves, data)
	updateSankey(new_data[0])
	updateChart(new_data[1], sankey.size())
	updateBoard(chess.board(), new_data[1])
}

// in: array of string pgn moves
// input is array of moves
const FULL_EXPLORE_CONSTANT = 2
const PARTIAL_EXPLORE_CONSTANT = 4
var getTrimmedTree = (moves, data) => {
	var res = []
	var firstLayer = []
	for (var i = 0; i < data.length; i++) {
		var movesSource = data[i].source.trim().split(" ")
		if (movesSource.smash().match("^" + moves.smash())) {
			// f - full explore value
			for (var f = 0; f < FULL_EXPLORE_CONSTANT; f++) {
				if (moves.length + f === movesSource.length) {
					if (moves.smash() === movesSource.smash()) {
						firstLayer.push(data[i])
					}
					res.push(data[i])
					break
				}
			}
		}
	}
	return [res, firstLayer]
}

var out = []
var movetree = { "": { num: 0, curr: "" } }
async function loadData(settings) {
	var minrating = 0
	var winner = 0 // 0=either, 1=white, -1=black, 2=draw

	if (settings) {
		minrating = settings.minrating
		winner = settings.winner
	}

	var filtered = (datum) => {
		// filter by rating
		var _minrating = (+datum.white_rating < +datum.black_rating) ? +datum.white_rating : +datum.black_rating
		if (_minrating  < minrating)
			return true

		// filter by outcome
		var _winner = datum.winner
		var selected = (winner == -1 && _winner === "black")
		selected = selected || (winner == 1 && _winner === "white")
		selected = selected || winner == 0
		selected = selected || (winner == 2 && _winner === "draw")
		if (!selected) {
				return true
		}
		return false
	}

	await d3.csv("./data/games.csv", function (data) {
		out = []
		movetree = { "": { num: 0, curr: "" } }
		// for (var i = 0; i < data.length; i++) {
		for (var i = 0; i < 1000; i++) {
			if (!filtered(data[i])) {
				var moves = data[i]['moves'].split(" ")
				var currMove = movetree[""]
				for (var j = 0; j < moves.length; j++) {
					currMove.num++
					if (currMove[moves[j]] === undefined) {
						currMove[moves[j]] = {
							num: 0,
							wwins: 0,
							draws: 0,
							bwins: 0,
							curr: currMove.curr + moves[j] + " ",
						}
					}
					currMove = currMove[moves[j]]
				}
				currMove.num++
				if (data[i].winner === "white") {
					currMove.wwins++
				} else if (data[i].winner === "black") {
					currMove.bwins++
				} else {
					currMove.draws++
				}

				currMove["D" + i] = data[i]
			}
		}

		var q = new Queue()
		q.push(movetree[""])
		while (q.size() > 0) {
			var curr = q.pop()
			var keys = Object.keys(curr)
			keys.sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i]
				if (key !== "num" && key !== "curr" && key !== "wwins" && key !== "bwins" && key !== "draws" && key[0] !== "D") {
					out.push({ "source": curr.curr, "target": curr[key].curr, "value": curr[key].num })
					q.push(curr[key])
					if (curr[key].wwins > 0)
						out.push({ "source": curr[key].curr, "target": "white", "value": curr[key].wwins })
					if (curr[key].bwins > 0)
						out.push({ "source": curr[key].curr, "target": "black", "value": curr[key].bwins })
					if (curr[key].draws > 0)
						out.push({ "source": curr[key].curr, "target": "draws", "value": curr[key].draws })
				}
			}
		}
		updatePage(out)
	});
}
loadData()

// set svg properties
var svg = d3.select("#sankey")
	.attr("preserveAspectRatio", "xMidYMid")
	.style("left", x + "%")
	.style("top", y - height * 0.003 + "%")
	.style("padding-top", 10 + "%")
// Set the sankey diagram properties
var sankey = d3.sankey()
	.nodeWidth(15)
	.nodePadding(3)
	.size([width / 2.1, height / 1.1])
d3.select(window).on("resize", function () {
	var width = body.style("width")
	width = +width.substring(0, width.length - 2)
	var height = body.style("height")
	height = +height.substring(0, height.length - 2)
	sankey.size([width / 2.1, height / 1.1])
	svg.style("top", y - height * 0.003 + "%")
	updatePage(out)
})
var units = "Widgets"
// format variables
var formatNumber = d3.format(",.0f"),    // zero decimal places
	format = function (d) { return formatNumber(d) + " " + units; },
	color = d3.scaleOrdinal(d3.schemeCategory10);
//var node = svg.append("g").selectAll(".node")
var l = svg.append("g")
var n = svg.append("g")
var updateSankey = (data) => {
	d3.select("#sankey").selectAll("g").remove()
	//link.remove()
	//n.remove()
	//link = svg.append("g").selectAll(".link")
	//n = svg.append("g")
	l = svg.append("g")

	var path = sankey.link();

	//set up graph in same style as original example but empty
	graph = { "nodes": [], "links": [] };

	data.forEach(function (d) {
		graph.nodes.push({ "name": d.source });
		graph.nodes.push({ "name": d.target });
		graph.links.push({
			"source": d.source,
			"target": d.target,
			"value": +d.value
		});
	});

	// return only the distinct / unique nodes
	graph.nodes = d3.keys(d3.nest()
		.key(function (d) { return d.name; })
		.object(graph.nodes));

	// loop through each link replacing the text with its index from node
	graph.links.forEach(function (d, i) {
		graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
		graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
	});

	// now loop through each nodes to make nodes an array of objects
	// rather than an array of strings
	graph.nodes.forEach(function (d, i) {
		graph.nodes[i] = { "name": d };
	});

	sankey
		.nodes(graph.nodes)
		.links(graph.links)
		.layout(32);
	// add in the links
	var link = l.selectAll(".link")
	link.data(graph.links, d => d.source.name + ":" + d.target.name)
		.enter().append("path")
		.attr("class", "link")
		.attr("d", path)
		.style("stroke-width", function (d) { return Math.max(1, d.dy); })
		.sort(function (a, b) { return b.dy - a.dy; })
		.merge(link).transition().duration(500)
			.attr("d", path)
			.style("stroke-width", function (d) { return Math.max(1, d.dy); })

	// add the link titles
	link.append("title")
		.text(function (d) {
			return d.source.name + " → " +
				d.target.name + "\n" + format(d.value);
		});
	
	link.exit().remove()
	d3.selectAll(".link").on("click", d => {
		console.log(d3.event.target)
		var name = d.target.name.trim()
		name = name.split(" ")[name.split(" ").length - 1]
		console.log(name)
		var success = chess.move(name)
		if (success !== null) {
			currMoves.push(name)
			updatePage(out)
		}
		
	})

	// add in the nodes
	var node = d3.select("#sankey").selectAll(".node").data(graph.nodes, d => d.name)
		.enter().append("g")
		.attr("class", "node")
		.attr("transform", function (d) {
			return "translate(" + d.x + "," + d.y + ")";
		})
		/*.call(d3.drag()
			.subject(function (d) {
				return d;
			})
			.on("start", function () {
				this.parentNode.appendChild(this);
			})
			.on("drag", dragmove))*/

	// add the rectangles for the nodes
	node.append("rect")
		.attr("height", function (d) { return d.dy; })
		.attr("width", sankey.nodeWidth())
		.style("fill", function (d) {
			return d.name.split(" ").length % 2 === 0 ? "white" : "black"
		})
		.style("stroke", function (d) {
			return d3.rgb(d.color).darker(2);
		})
	.append("title")
	.text(function (d) {
		return d.name + "\n" + format(d.value);
	})

	var getText = (mvs) => {
		if (mvs === "") {
			return "Game Start"
		}
		//if (moves.length > 0)
		moves = mvs.trim().split(" ")
		return moves[moves.length - 1]
		//return mvs.trim()
	}
	
	// add in the title for the nodes
	node.append("text")
		.attr("x", -6)
		.attr("y", function (d) { return d.dy / 2; })
		.attr("dy", ".35em")
		.attr("text-anchor", "end")
		.attr("transform", null)
		.attr("font-weight", 800)
		.text(d => getText(d.name))
		.filter(function (d) { return d.x < width / 2; })
		.attr("x", 6 + sankey.nodeWidth())
		.attr("text-anchor", "start")

	node.exit().remove()

	// the function for moving the nodes
	function dragmove(d) {
		d3.select(this)
			.attr("transform",
				"translate("
				+ d.x + ","
				+ (d.y = Math.max(
					0, Math.min(height - d.dy, d3.event.y))
				) + ")");
		sankey.relayout();
		link.attr("d", path);
	}
}