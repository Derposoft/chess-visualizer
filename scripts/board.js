// set the dimensions and margins of the board
var x = 1
var y = 5
var width = 700
var height = 700
var svgboard = d3.select("#board")
	.style("width", width + "%")
	.style("height", height + "%")
	.style("left", x + "%")
	.style("top", y + "%")
// set move entering textbox location
d3.select("#nextmove")
	.style("left", 10 + x + "%")
	.style("top", 1 + "%")
d3.select("#nextmovetext")
	.style("left", x + "%")
	.style("top", 1 + "%")
d3.select("#backmove")
	.style("left", 20 + x + "%")
	.style("top", 1 + "%")
d3.select("#settings")
	.style("left", 27 + x + "%")
	.style("top", 1 + "%")

	// legend
svgboard.append("image")
	.attr("x", 5.7 + "%")
	.attr("y", 1 + "%")
	.attr("height", 4.2 + "%")
	//.attr("style", "transform:scale(0.15, 0.2);border: 30px solid black;")
	.attr("xlink:href", "./assets/bar2.png")
svgboard.append("text")
	.attr("font-size", "15px")
	.style("font-weight", "bold")
	.attr("x", 5.7 + "%")
	.attr("y", 5.5 + "%")
	//.attr("transform", "rotate(-90)")//, translate(" + 0 + ", " + 0 + ")")
	.text("Square Popularity")

var pieceImages = svgboard.append("g")
var background = svgboard.append("g")
var heatMap = svgboard.append("g")

const X_SPACING = 0.7
const Y_SPACING = 1
var squares = []
var updateBoard = (board, firstlayer) => {
	// init data
	squares = []
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[i].length; j++) {
			squares.push({
				y: +i,
				x: +j,
				color: (board[i][j] === null) ? "" : board[i][j].color,
				piece: (board[i][j] === null) ? "" : board[i][j].type,
				orig_x: +j
			})
		}
	}
	// draw board
	var pieces = pieceImages.selectAll("image").data(squares, d => d.color + " " + d.piece + " " + d.orig_x)
	pieces.enter().append("image")
			.attr("class", ".piece")
			.attr("xlink:href", d => "./assets/" + d.color + d.piece + ".png")
			.attr("width", X_SPACING + "%")
			.attr("height", Y_SPACING + "%")
			.attr("x", d => d.x * X_SPACING + "%")
			.attr("y", d => d.y * Y_SPACING + "%")
		.merge(pieces).transition().duration(300)
			.attr("x", d => d.x * X_SPACING + "%")
			.attr("y", d => d.y * Y_SPACING + "%")
	pieces.exit().remove()

	background.remove()
	background = svgboard.append("g")
	background.selectAll("rect").data(squares).enter().append("rect")
		.attr("class", ".piece")
		.style("stroke-width", 1)
		.style("stroke", "black")
		.attr("width", X_SPACING + "%")
		.attr("height", Y_SPACING + "%")
		.attr("x", d => d.x * X_SPACING + "%")
		.attr("y", d => d.y * Y_SPACING + "%")
		.style("opacity", 0.3)
		.attr("fill", d => (d.x + d.y) % 2 === 0 ? "grey" : "none")
	
	// add heats
	/*var moves = d.target.split(" ")
	var dest = moves[moves.length - 1].substring(moves.length - 2).toLowerCase()
	var x = +(dest.charAt(0) - 61)
	var y = +dest.charAt(1)
	console.log(firstlayer)*/
	var heat = d3.scaleLinear()
		.domain([0, 20])
		.range(["yellow", "red"])
	heatMap.remove()
	heatMap = svgboard.append("g")
	heatMap.selectAll("rect").data(firstlayer).enter().append("rect")
		.attr("class", ".piece")
		.attr("width", X_SPACING + "%")
		.attr("height", Y_SPACING + "%")
		.attr("x", d => {
			var moves = d.target.split(" ")
			var dest = moves[moves.length - 2]
			dest = dest.substring(dest.length - 2).toLowerCase()
			var x = +(dest.charCodeAt(0) - 97)
			return x * X_SPACING + "%"
		})
		.attr("y", d => {
			var moves = d.target.split(" ")
			var dest = moves[moves.length - 2]
			dest = dest.substring(dest.length - 2).toLowerCase()
			var y = +dest.charAt(1)
			return (8 - y) * Y_SPACING + "%"
		})
		.style("opacity", 0.4)
		.attr("fill", d => heat(d.value))
}