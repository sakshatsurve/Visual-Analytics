function scatterPlot(trips) {

	var width = 300;
	var height = 250;
	var padding = 70;

	var x = d3.scale.linear()
		.range([padding / 2, width - padding / 2]);

	var y = d3.scale.linear()
		.range([height - padding / 2, padding / 2]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.ticks(4);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(4);

	var a = {};
	var data = d3.keys(trips[0]).filter(function (d) {
		return (d !== "endtime" && d !== "maxspeed" && d !== "minspeed" && d !== "starttime" && d !== "streetnames" && d !== "taxiid" && d !== "tripid" && d !== "timeslot");
	});
	var n = data.length;
	data.forEach(function (trait) {
		a[trait] = d3.extent(trips, function (d) {
			return d[trait];
		});
	});
	xAxis.tickSize(width * n);
	yAxis.tickSize(-height * n);

	d3.select("#chart > *").remove();
	d3.select("#chart").selectAll("div.tooltip").remove();

	var svg = d3.select("#chart")
		.append("svg")
		.attr("width", width * n + padding)
		.attr("height", height * n + padding)
		.append("g")
		.attr("transform", "translate(" + padding + "," + padding / 2 + ")");

	svg.selectAll(".x.axis")
		.data(data)
		.enter().append("g")
		.attr("class", "x axis")
		.attr("transform", function (d, i) {
			return "translate(" + (n - i - 1) * width + ",0)";
		})
		.each(function (d) {
			x.domain(a[d]);
			d3.select(this).call(xAxis);
		});

	svg.selectAll(".y.axis")
		.data(data)
		.enter().append("g")
		.attr("class", "y axis")
		.attr("transform", function (d, i) {
			return "translate(0," + i * height + ")";
		})
		.each(function (d) {
			y.domain(a[d]);
			d3.select(this).call(yAxis);
		});

	var cell = svg.selectAll(".cell")
		.data(cross(data, data))
		.enter().append("g")
		.attr("class", "cell")
		.transition()
			.duration(6000)
		.attr("transform", function (d) {
			return "translate(" + (n - d.i - 1) * width + "," + d.j * height + ")";
		})
		.each(plot);
	var tooltip = d3.select("#chart")
		.append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);
	

	cell.filter(function (d) {
		return d.i === d.j;
	})
		.append("text")
		.attr("x", padding)
		.attr("y", padding)
		.attr("dy", ".71em")
		.text(function (d) {
			return d.x;
		});

	function plot(p) {
		var cell = d3.select(this);

		x.domain(a[p.x]);
		y.domain(a[p.y]);

		cell.append("rect")
			.attr("class", "frame")
			.attr("x", padding / 2)
			.attr("y", padding / 2)
			.attr("width", width - padding)
			.attr("height", height - padding);

		cell.selectAll("circle")
			.data(trips)
			.enter().append("circle")
			.attr("cx", function (d) {
				return x(d[p.x]);
			})
			.attr("cy", function (d) {
				return y(d[p.y]);
			})
			.attr("r", 6)
			.style("fill", "#FF3346")
			.on("mouseover", function (d) {
				d3.select('.tooltip')
				tooltip.html("Trip Id: " + d.tripid + "<br/> "
					+ "Average Speed: " + d.avspeed + "<br/> "
					+ "Distance: " + d.distance + "<br/>"
					+ "Duration: " + d.duration
				)
					.style("left", (d3.mouse(d3.select("#chart").node())[0] + 20) + "px")
					.style("top", (d3.mouse(d3.select("#chart").node())[1] - 18) + "px")
					.transition()
					.duration(200) // ms
					.style("opacity", .7);

				var circle = d3.select(this);
				circle.transition()
					.style("fill", "red")
					.duration(800)
					.style("opacity", 1)
					.attr("r", 10)
					.ease("elastic");
			})
			.on("mouseout", function (d) {
				tooltip.transition()
					.duration(300)
					.style("opacity", 0);

				var circle = d3.select(this);
				circle.transition()
					.style("fill", "#00DD55")
					.duration(800)
					.style("opacity", .7)
					.attr("r", 6)
					.ease("elastic");

			});
	}

	function cross(a, b) {
		var c = [], n = a.length, m = b.length, i, j;
		for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({ x: a[i], i: i, y: b[j], j: j });
		return c;
	}
}
