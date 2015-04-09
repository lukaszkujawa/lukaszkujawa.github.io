(function() {

	var Dataset1 = [];

	var Settings = {
		width: 600,
		height: 600,
		margin: 20
	}

	var DataGen = {
		svg: null,
		
		xScaleValues: {from:-1, to:1},
		yScaleValues: {from:-1, to:1},

		xAxis: null,
		yAxis: null,

		xScale: null,
		yScale: null,

		leftClick: function(coord) {

			Dataset1.push({
				x: coord[0],
				y: coord[1],
				c: DataGen.getSelectedButton()
			});

		},

		redraw: function() {
			var point = this.svg.selectAll("point").data(Dataset1);

			var g = point.enter().append("g");
			g.append("circle")
				.attr("cx", function(d){ return d.x; })
				.attr("cy", function(d){ return d.y; })
				.attr("r", "3")
				.attr("fill", function(d){ return d.c; });
		},

		getSelectedButton: function() {
			return d3.select("button.selected").attr('id');
		},

		buttonUpdate: function() {
			d3.selectAll("button.color").classed('selected', false);
			d3.select(this).classed('selected', true);
		},

		getExportValue: function(name) {
			return d3.select(".export-panel input[name=" + name + "]").property("value");
		},

		exportDataset: function() {
			var xs = d3.scale.linear()
				.range([DataGen.xScaleValues.from, DataGen.xScaleValues.to])
				.domain([Settings.margin, Settings.width - Settings.margin]);

			var ys = d3.scale.linear()
				.range([DataGen.yScaleValues.to, DataGen.yScaleValues.from])
				.domain([Settings.margin, Settings.height - Settings.margin]);

			var data = "";

			for(i in Dataset1) {
				var o = Dataset1[i];
				data += xs(o.x) + "," + ys(o.y) + "," + DataGen.getExportValue(o.c) + "\n";
			}

			d3.select(".export textarea").text(data);


		},

		drawAxis: function() {
			this.xScale = d3.scale.linear()
				.domain([this.xScaleValues.from, this.xScaleValues.to])
				.range([Settings.margin, Settings.width - Settings.margin]);

			this.yScale = d3.scale.linear()
				.domain([this.yScaleValues.to, this.yScaleValues.from])
				.range([Settings.margin, Settings.height - Settings.margin]);

			this.xAxis = d3.svg.axis()
				.scale(this.xScale)
				.orient("bottom")
				.tickSize(1);

			this.yAxis = d3.svg.axis()
				.scale(this.yScale)
				.orient("left")
				.tickSize(1);
			
			if(this.svg.select("g.axis.x").size() == 1) {
				this.svg.select("g.axis.x").call(this.xAxis);
				this.svg.select("g.axis.y").call(this.yAxis);
			}
			else {
				this.svg.append("g")
					.attr("class", "axis x")
					.attr("transform", "translate(0," + (Settings.height / 2) + ")")
					.call(this.xAxis);

				this.svg.append("g")
					.attr("class", "axis y")
					.attr("transform", "translate("+(Settings.width/2)+",0)")
					.call(this.yAxis);
			}
		},

		init: function() {
			var self = this;

			this.svg = d3.select("div.svg").append("svg").attr("width", Settings.width).attr("height", Settings.height);

			this.drawAxis();

			this.svg.on("click", function(d){
				var coord = d3.mouse(this);
				self.leftClick(coord);
				self.redraw();
			});

			d3.selectAll("button.color").on("click", self.buttonUpdate);

			d3.select("button#export").on("click", self.exportDataset);
			d3.select("button#updateAxis").on("click", function(){ 
				self.xScaleValues = {
					from:d3.select("input[name=x_from]").property("value"), 
					to:d3.select("input[name=x_to]").property("value")
				};

				self.yScaleValues = {
					from:d3.select("input[name=y_from]").property("value"), 
					to:d3.select("input[name=y_to]").property("value")
				};

				self.drawAxis(); 
			});
		}
	}


	DataGen.init();

})();