(function() {

	var Dataset = [];
	var Points = [];
	var Settings = {
		width: 600,
		height: 600,
		margin: 50
	}

	var CostFunction = {
		width: 600,
		height: 600,
		size: 10,
		xNorm: null,
		yNorm: null,
		xDeNorm: null,
		yDeNorm: null,
		xi: 0,
		yi: 0,
		minCost: 0,
		maxCost: 0,
		svg: null,
		prevPoint: null,
		xAxis: null,
		yAxis: null,

		init: function() {
			
			this.initScales();
			this.initAxis();

			this.svg = d3.select("div.svg").append("svg")
							.attr("width", this.width)
							.attr("height", this.height);

			this.xi = (this.width-2*Settings.margin) / this.size;
			this.yi = (this.height-2*Settings.margin) / this.size;

			this.prevPoint = {
				theta0: AnimatedFunction.theta0,
				theta1: AnimatedFunction.theta1
			};

			this.svg.append("text")
				.attr("y", Settings.margin - 10)
				.attr("x", Settings.margin)
				.text("Cost Function: J(theta0, theta1)");
			
			this.svg.append("g")
				.attr("class", "axis x")
				.attr("transform", "translate(0," + (this.height - Settings.margin) + ")")
				.call(this.xAxis);


			this.svg.append("g")
				.attr("class", "axis y")
				.attr("transform", "translate(" + Settings.margin + ",0)")
				.call(this.yAxis);
			
		},

		initScales: function() {
			this.xNorm = d3.scale.linear()
				.domain([Settings.margin , this.width - Settings.margin ])
				.range([-3, 3]);

			this.yNorm = d3.scale.linear()
				.domain([Settings.margin , this.height - Settings.margin ])
				.range([-3, 3]);

			this.xDeNorm = d3.scale.linear()
				.domain([-3, 3])
				.range([Settings.margin , this.width - Settings.margin ]);

			this.yDeNorm = d3.scale.linear()
				.domain([-3, 3])
				.range([Settings.margin , this.height - Settings.margin]);
		},

		initAxis: function() {
			this.xAxis = d3.svg.axis()
				.scale(this.xDeNorm)
				.orient("bottom");

			this.yAxis = d3.svg.axis()
				.scale(this.yDeNorm)
				.orient("left");
		},


		getCost: function(theta0, theta1) {
			var cost = 0;
			for(var i = 0 ; i < Dataset.length ;i++) {
				cost += Math.pow((Dataset[i].x * theta1 + theta0 - Dataset[i].y), 2);
			}

			return cost / 2 / Dataset.length;
		},

		getMesh: function() {
			var matrix = new Array(this.xi),
				xx = 0;
			this.minCost = 999;
			this.maxCost = -999;
			for(var x = Settings.margin ; x < this.width - Settings.margin; x += this.size) {
				matrix[xx] = new Array(this.yi);
				var yy = 0;
				for(var y = Settings.margin; y < this.height - Settings.margin ; y += this.size) {
					var theta0 = this.xNorm(x),
						theta1 = this.yNorm(y);

					matrix[xx][yy] = this.getCost(theta0, theta1);
					this.minCost = Math.min(this.minCost, matrix[xx][yy]);
					this.maxCost = Math.max(this.maxCost, matrix[xx][yy]);
					yy++;
				}
				xx++;
			}

			return matrix;
		},

		animatePointer: function() {
			if(Dataset.length == 0) {
				return;
			}

			var x1 = (CostFunction.xDeNorm(this.prevPoint.theta0)),
				y1 = (CostFunction.yDeNorm(this.prevPoint.theta1)),
				x2 = (CostFunction.xDeNorm(AnimatedFunction.theta0)),
				y2 = (CostFunction.yDeNorm(AnimatedFunction.theta1));

			var dist = Math.pow(x1-x2,2) + Math.pow(y1-y2,2);

			if(dist < 1) {
				return;
			}

			var point = this.svg.selectAll("point").data([{
							theta0: AnimatedFunction.theta0, 
							theta1: AnimatedFunction.theta1}]);

			var g = point.enter().append("g");
			g.append("line")
				.attr("stroke", "red")
				.attr("x1", Math.round(x1))
				.attr("y1", Math.round(y1))
				.attr("x2", function(d){return Math.round(x2);})
				.attr("y2", function(d){return Math.round(y2);});

			g.append("circle")
				.attr("cx", Math.round(x2))
				.attr("cy", Math.round(y2))
				.attr("r", "1.4")
				.attr("fill", "red");

			this.prevPoint = {
							theta0: AnimatedFunction.theta0, 
							theta1: AnimatedFunction.theta1};
		},

		draw: function(svg2) {
			if(Dataset.length == 0) {
				return;
			}

			var svg = this.svg;

			var costFunc = this.svg.selectAll("g.costfunction");
			if(costFunc.size() == 0) {
				costFunc = svg.append("g").attr("class","costfunction");
			}
			
			costFunc.selectAll("rect").remove();
			
			var colScale = d3.scale.linear()
				.domain([this.minCost, this.maxCost])
				.range([255, 0]);

			var mesh = this.getMesh();
			for(var x = 0  ; x < mesh.length ; x++) {
				for(var y = 0 ; y < mesh[x].length ; y++) {
					var val = Math.round(colScale(mesh[x][y]));
					var col = val % 60;
					if(val == 255) {
						var rgb = "rgb(255,255,255)";
					}
					else if(col < 20 ) {
						val -= 20;
						
						var rgb = "rgb("+val+","+val+","+val+")";
					}
					else if(col < 40) {
						val -= 50;
						
						var rgb = "rgb("+val+","+val+","+val+")";
					}
					else {
						val -= 100;
						
						var rgb = "rgb("+val+","+val+","+val+")";
					}

					costFunc.append("rect")
								.attr("x", Settings.margin + x * this.size)
								.attr("y", Settings.margin + y * this.size)
								.attr("width", this.size)
								.attr("height", this.size)
								.attr("fill", rgb);
				}
			}

		}
	}

	var AnimatedFunction = {
		theta0: 0,
		theta1: 0,
		learnRate: 0.07,
		xDenorm: null,
		yDenorm: null,

		init: function() {
			this.initScales();
		},

		iterateTheta: function() {
			var vt = this.getGradDescVector();
			this.theta0 -= vt.v0;
			this.theta1 -= vt.v1;
		},

		initScales: function() {
			this.xDenorm = d3.scale.linear()
				.domain([0, 1])
				.range([Settings.margin, Settings.width - Settings.margin]);

			this.yDenorm = d3.scale.linear()
				.domain([0, 1])
				.range([Settings.height - Settings.margin, Settings.margin]);
		},

		getGradDescVector: function() {
			var sum0 = 0, sum1 = 0;
			var m = Dataset.length;
			var a = this.learnRate;

			for(var i = 0 ; i < m ;i++) {
				var diff = Dataset[i].x * this.theta1 + this.theta0 - Dataset[i].y;

				sum0 += diff;
				sum1 += diff * Dataset[i].x;
			}

			return {v0: a * sum0 / m / 2, 
					v1: a * sum1 / m / 2};
		},

		draw: function(svg) {
			var func = svg.selectAll("line.func")
							.data([{theta0: this.theta0, theta1: this.theta1}]);

			var self = this;
			var xLeft = -1;
			var xRight = 2;

			var f = [func.transition(), func.enter().append("line")];

			for(i in f) {
				f[i].attr("class", "func")
					.attr("x1", function(d) { return self.xDenorm(xLeft); } )
					.attr("y1", function(d) { return self.yDenorm(d.theta1 * xLeft + d.theta0); } )
					.attr("x2", function(d) { return self.xDenorm(xRight); } )
					.attr("y2", function(d) { return self.yDenorm(d.theta0+ d.theta1 * xRight); } );
			}

			var caption = svg.selectAll("text.theta")
								.data([ 
									{v: this.theta0, i:0},
									{v: this.theta1, i:1} 
								]);

			var c = [caption, caption.enter().append("text").attr("class","theta")];
			for(i in c) {
				c[i]
					.attr("x", 50)
					.attr("y", function(d){ return Settings.height - 20 + 16 * d.i})
					.text(function(d){ return "Theta" + d.i + ": " + Math.round(d.v * 100000) / 100000});
			}	

			var learnRate = svg.selectAll("text.learnRate")
								.data([this.learnRate]);

			var l = [learnRate, learnRate.enter().append("text").attr("class","learnRate")];
			for(i in l) {
				l[i]
					.attr("x", 170)
					.attr("y", Settings.height - 20)
					.text(function(d) {return "Animation Speed: x" + GradDesc.animationSpeed + " (press q/w to change)"});
			}
			
		}

	}

	var Axies = {
		xAxis: null,
		yAxis: null,

		xScale: null,
		yScale: null,

		init: function() {
			this.initScales();
			this.initAxis();
		},

		initScales: function() {
			this.xScale = d3.scale.linear()
				.domain([0, Settings.width])
				.range([Settings.margin, Settings.width - Settings.margin]);

			this.yScale = d3.scale.linear()
				.domain([Settings.height, 0])
				.range([Settings.margin, Settings.height - Settings.margin]);
		},

		initAxis: function() {	
			this.xAxis = d3.svg.axis()
				.scale(this.xScale)
				.orient("bottom")
				.tickSize(-Settings.width+Settings.margin*2);

			this.yAxis = d3.svg.axis()
				.scale(this.yScale)
				.orient("left")
				.tickSize(-Settings.width+Settings.margin*2);
		},

		draw: function(svg) {
			svg.append("g")
				.attr("class", "axis x")
				.attr("transform", "translate(0," + (Settings.height - Settings.margin) + ")")
				.call(this.xAxis);

			svg.append("g")
				.attr("class", "axis y")
				.attr("transform", "translate(" + Settings.margin + ",0)")
				.call(this.yAxis);
		}
	};

	var GradDesc = {

		revXScale: null,
		revYScale: null,
		normX: null,
		normY: null,
		
		svg: null,
		animationSpeed: 1,


		init: function() {
			this.initScales();
			Axies.init();
			this.initSvg();
			AnimatedFunction.init();
			CostFunction.init();

			d3.select("body").on("keydown", function() {
				if(d3.event.keyCode == 81) {
					if(GradDesc.animationSpeed > 1) {
						GradDesc.animationSpeed -= 1;
					}
				}
				else if(d3.event.keyCode == 87) {
					if(GradDesc.animationSpeed < 10) {
						GradDesc.animationSpeed += 1;
					}
				}
			});

			this.drawAll();
		},

		initScales: function() {
			this.revXScale = d3.scale.linear()
				.domain([Settings.margin, Settings.width - Settings.margin])
				.range([0, Settings.width]);
				
			this.revYScale = d3.scale.linear()
				.domain([Settings.margin, Settings.height - Settings.margin])
				.range([Settings.height, 0]);

			this.normX = d3.scale.linear()
				.domain([Settings.margin, Settings.width - Settings.margin])
				.range([0, 1]);

			this.normY = d3.scale.linear()
				.domain([Settings.margin, Settings.height - Settings.margin])
				.range([1, 0]);
		},

		initSvg: function() {
			var self = this;
			this.svg = d3.select("div.svg").append("svg")
							.attr("width", Settings.width)
							.attr("height", Settings.height);

			this.svg.on("click", function(d){
				var coord = d3.mouse(this);
				Points.push({	
					x: self.revXScale(coord[0]),
					y: self.revYScale(coord[1])
				}); 

				Dataset.push({
					x: self.normX(coord[0]),
					y: self.normY(coord[1])
				});

				self.draw(self.svg);
				CostFunction.draw(self.svg);
			});
		},

		draw: function(svg) {
			var points = svg.selectAll("g.point")
							.data(Points);

			var g = points.enter()
							.append("g")
							.attr("class", "point");
			
			g.append("circle")
					.attr("cx", function(d){ return Axies.xScale(d.x); })
					.attr("cy", function(d){ return Axies.yScale(d.y); })
					.attr("r", 6);

			g.append("circle")
					.attr("class", "c")
					.attr("cx", function(d){ return Axies.xScale(d.x); })
					.attr("cy", function(d){ return Axies.yScale(d.y); })
					.attr("r", 1);


			points.exit().remove();
		},

		drawAll: function() {
			this.draw(this.svg);

			this.svg.append("text")
				.attr("y", Settings.margin - 10)
				.attr("x", Settings.margin)
				.text("Hypothesis Function: Ho(x)=theta0 + theta1 * x");

			AnimatedFunction.draw(this.svg);
			Axies.draw(this.svg);
			CostFunction.draw(this.svg);

		}


	}

	var go = true;
	GradDesc.init();
	setInterval(function() {
		if(go && Dataset.length > 1) {
			for(i = 0 ; i < 100 + (200 * GradDesc.animationSpeed) ; i++) {
				AnimatedFunction.iterateTheta();
			}

			AnimatedFunction.draw(GradDesc.svg);
			CostFunction.animatePointer();
		}
	}, 500);
		

})();