var body = d3.select("body")
var WINDOW_WIDTH = body.style("width")
WINDOW_WIDTH = +WINDOW_WIDTH.substring(0, WINDOW_WIDTH.length - 2)

var cwidth = WINDOW_WIDTH / 2
var chartData = []

const X_OFFSET = 20,
	Y_OFFSET = 70
var chart = d3.select("#chart")
var g = chart.append("g")
	.attr("transform", "translate(" + X_OFFSET + "," + Y_OFFSET + ")")
var gt = chart.append("g")

var BAR_WIDTH = 5
var LABEL_OFFSET = 10
function updateChart(data, wh) {
	var BAR_SPACING = wh[0] / 1.2
	var cheight = wh[1] / 3.7
	chartData = data
	var getName = (d) => d.target.split(" ")[d.target.split(" ").length - 2]
	
	var y = d3.scaleLinear().range([0, cheight])
	y.domain([0, d3.max(data.map(x => x.value))])

	var rects = g.selectAll("rect").data(data, d => getName(d))
	rects.enter()
		.append("rect")
			.attr("class", ".piece")
			.attr("x", (_, i) => i * BAR_SPACING / data.length + X_OFFSET)
			.attr("width", BAR_WIDTH + "%")
			.attr("height", d => d.value / y.domain()[1] * cheight)
			.attr("fill", "gray")
			.attr("style", "stroke:black; stroke-width:1;")
		.merge(rects).transition().duration(500)
		.attr("x", (_, i) => i * BAR_SPACING / data.length + X_OFFSET)
		.attr("height", d => d.value / y.domain()[1] * cheight)
	rects.exit().transition().duration(100).attr("opacity", 0).remove()

	var labels = gt.selectAll("text").data(data, d => getName(d))
	labels.enter()
		.append("text")
			.attr("class", ".piece")
			.attr("x", (_, i) => i * BAR_SPACING / data.length + 2 * X_OFFSET)
			.attr("y", Y_OFFSET - 25)
			.attr("dy", "1em")
			.attr("font-weight", 800)
			.text(d => getName(d))
		.merge(labels).transition().duration(500)
			.attr("x", (_, i) => i * BAR_SPACING / data.length + 2 * X_OFFSET)
			.text(d => getName(d))
	labels.exit().transition().duration(100).style("opacity", 0).remove()

	g.select("#axis").remove()
	g.append("g").attr("id", "axis")
		.call(d3.axisRight(y).tickFormat(d3.format(".1d")))
}

// Add graph title
chart.append("text")
	.attr("font-size", "23px")
	.style("font-weight", "bold")
	.attr("x", 0)
	.attr("y", 30)
	.text("Moves Previously Played in this Position")

// Add the axis labels
chart.append("text")
	.attr("font-size", "14px")
	.style("font-weight", "bold")
	.attr("transform", "rotate(-90), translate(" + (-cheight / 2 - LABEL_OFFSET - Y_OFFSET) + ", " + (LABEL_OFFSET) + ")")
	.text("Play Frequency")
chart.append("text")
	.attr("font-size", "14px")
	.style("font-weight", "bold")
	.attr("transform", "translate(" + (cwidth / 2 - LABEL_OFFSET) + "," + Y_OFFSET - 10 + ")")
	.text("Moves")