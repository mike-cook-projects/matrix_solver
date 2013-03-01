//////////////////////////////////////////////////////////////////////////////////////////////////
// MATRIX PUZZLE SOLVER  							     		//
// Author: Mike Cook								     		//
// Date: 09/03/12									     	//
// Description: Solves a matrix puzzle with the following conditions:				//
// 				1. Each tile gives the point value on the tile			//
// 				2. Tiles marked "D" double the current point total		//
// 				3. Once crossed, a tile provides no additional points		//
// 												//
// 				With those requirements, this library solves a matrix of random	//
// 				dimensions and starting point by showing the optimal route.	//
//////////////////////////////////////////////////////////////////////////////////////////////////
var MatrixSolver = {
	// "Constants"
	ROW_LIMIT: 5,
	COLUMN_LIMIT: 11,

	// The container element for the matrix display
	container: null,

	// The matrix to solve
	matrix: null,
	
	// The size of the matrix grid
	size: null,

	// Number of moves allowed
	movesAllowed: null, 

	// The finished routes that were computed
	finishedRoutes: null,

	// The best route
	bestRoute: null,

	// The best route's score
	bestScore: null,

	// Computation start time
	startTime: null,

	// Computation end time
	endTime: null,

	//// Initialization
	// p_matrix: The grid matrix (2-dimensional mixed-type array)
	// p_moves_allowed: The number of moves allowed
	init: function(p_matrix, p_moves_allowed) {
		// Set the container
		MatrixSolver.container = $("#matrix_window")[0];
	
		// Clear values
		MatrixSolver.finishedRoutes = [];
		MatrixSolver.bestScore = 0;
		MatrixSolver.bestRoute = null;

		// Set the locals
		MatrixSolver.matrix = p_matrix;
		MatrixSolver.size = p_matrix.length;

		// Add one to the passed moves allowed to handle the inital starting position
		MatrixSolver.movesAllowed = p_moves_allowed + 1;

		// Set the Start Time
		MatrixSolver.startTime = +new Date();

		// Calculate the routes
		MatrixSolver.computeRoutes();

		// Find the best route
		MatrixSolver.findBestRoute();

		// Set the End Time
		MatrixSolver.endTime = +new Date();

		// Create the results table
		MatrixSolver.createResultTable();

		// Show the best result
		MatrixSolver.showBestRoute();
	},
	
	//// Construct a random matrix
	randomMatrix: function() {
		// Matrix
		var matrix = [];

		// Set a size
		var size = Math.floor((Math.random() * (MatrixSolver.ROW_LIMIT - 3 + 1)) + 3);

		// Loop through the columns
		for (var col = 0; col < size; col++) {
			// Matrix row
			var matrix_row = [];

			// Loop through the rows
			for (var row = 0; row < size; row++) {
				// Get value
				var value = Math.floor((Math.random() * 12) + 1);

				// Handle D, F, and X
				switch (value) {
					case 10:
						value = "D";
						break;
					case 11:
						value = "F";
						break;
					case 12:
						value = "X";
						break;
				}

				// Set the value
				matrix_row.push(value);
			}

			// Add the row to the matrix
			matrix.push(matrix_row);
		}

		// Set the starting point by random coords
		var start_row = Math.floor((Math.random() * size));
		var start_col = Math.floor((Math.random() * size));

		// Set moves
		var moves = Math.floor((size * size) / 2) - 1;

		// Set the start
		matrix[start_row][start_col] = "S";

		// Start the solver
		MatrixSolver.init(matrix, size + 1);
	},

	//// Calulate the routes possible through the matrix
	computeRoutes: function() {
		// The current position we are checking
		var current_position;

		// Array of open routes being checked
		var open_routes = [];

		// Incrementer for generating useless ids
		var route_id = 0;

		// Loop through the Matrix columns to find the starting position
		for (var col = 0; col < MatrixSolver.matrix.length; col++) {
			// Loop through the rows
			for (var row = 0; row < MatrixSolver.matrix[col].length; row++) {
				// Check if we found the starting point
				if (typeof MatrixSolver.matrix[col][row] === "string" &&
					MatrixSolver.matrix[col][row].toUpperCase() === "S") {
					
					// Create an initial route with the starting position
					open_routes.push({
						// Initial id
						id: route_id,
						// Initial vector (0, 0) denotes no current velocity
						vector: { x: 0, y: 0 },
						// Initial point array
						points: [{ x: row, y: col, value: 'S' }]
					});
				}
			}
		}

		// Start computing routes
		while (open_routes.length > 0) {
			// Shorthand our current route
			var route = open_routes[0];

			// Get the most recent position in the route
			current_position = route.points[route.points.length - 1];

			// Check that we aren't at the move limite
			if (route.points.length === MatrixSolver.movesAllowed) {
				// Move the route to our finished routes array and delete it from open routes
				MatrixSolver.finishedRoutes.push(open_routes.splice(0, 1)[0]);
			} else {
				// Check if we can move left, and if our current vector is carrying us left
				if (current_position.x > 0 && current_position.x < MatrixSolver.size && route.vector.x < 1) {
					// Create a new leftward branching route and add it to our open routes
					open_routes.push(MatrixSolver.createRoute(current_position, route, -1, 0, ++route_id));
				}

				// Check if we can move down, and if our current vector is carrying us down
				if (current_position.y < MatrixSolver.size - 1 && route.vector.y > -1) {
					// Create a new downward branching route and add it to our open routes
					open_routes.push(MatrixSolver.createRoute(current_position, route, 0, 1, ++route_id));
				}

				// Check if we can move up, and if our current vector is carrying us up
				if (current_position.y > 0 && current_position.y < MatrixSolver.size && route.vector.y < 1) {
					// Create a new upward branching route and add it to our open routes
					open_routes.push(MatrixSolver.createRoute(current_position, route, 0, -1, ++route_id));
				}

				// Finally, check if we can move right, and if our vector is carrying us right
				if (current_position.x < MatrixSolver.size - 1 && route.vector.x > -1) {
					// We don't create a new branching route, but simply add this spot to the existing route
					var new_position = { 
						x: current_position.x + 1, 
						y: current_position.y 
					};

					// Get the value for the new position, checking for repeats
					new_position.value = MatrixSolver.getMatrixValue(route, new_position);
					
					// Update the route vector
					route.vector = { x: 1, y: 0 };

					// Add the new position to the current route
					route.points.push(new_position);
				} else {
					// Incomplete route, so just dump it
					open_routes.splice(0, 1);
				}
			} 
		}
	},

	//// Get the value for the matrix, accounting for repeating steps
	getMatrixValue: function(p_route, p_current_position) {
		// Loop through the route points (excluding our current)
		for (var i = 0; i < p_route.points.length - 1; i++) {
			// Check for a match
			if (p_route.points[i].x === p_current_position.x && 
				p_route.points[i].y === p_current_position.y) {
				// Return an empty block
				return "F";
			}
		}

		// Otherwise return the normal value
		return MatrixSolver.matrix[p_current_position.y][p_current_position.x];
	},

	//// Create a new route branching from an existing one
	// p_position: The current cell being checked
	// p_route: The route we are branching from
	// p_offset_x: The x offset of the new move
	// p_offset_y: The y offset of the new move
	// p_route_id: Id for new route (useless outside of debugging)
	createRoute: function(p_position, p_route, p_offset_x, p_offset_y, p_route_id) {
		// Create a new route object
		var new_route = {
			id: p_route_id,
			vector: { x: p_offset_x, y: p_offset_y},
			points: []
		};

		// Loop through the current route points
		for (var i = 0; i < p_route.points.length; i++) {
			// Copy the existing route points (since JS passes objects by reference by default)
			new_route.points.push({ 
				x: p_route.points[i].x, 
				y: p_route.points[i].y, 
				value: p_route.points[i].value 
			});
		}

		// Create a new position
		var new_position = { 
			x: p_position.x + p_offset_x, 
			y: p_position.y + p_offset_y
		};

		// Get the value for the new position, checking for repeats
		new_position.value = MatrixSolver.getMatrixValue(new_route, new_position);
		
		// Add our new position to the route       
		new_route.points.push(new_position);

		// Return the route
		return new_route;
	},

	//// Find the route with the highest point total
	findBestRoute: function() {
		// Flag for determining if route is valid
		var valid = true;

		// The current point total
		var current_points = 0;

		// The current point value of a specific cell
		var point_value = 0;

		// Loop through our finished routes
		for (var i = 0; i < MatrixSolver.finishedRoutes.length; i++) {
			// Set default for valid flag
			valid = true;

			// Set default for current points
			current_points = 0;

			// Loop through the current route's points
			for (var p = 0; p < MatrixSolver.finishedRoutes[i].points.length; p++) {
				// Set default for the point value
				point_value = 0;

				// Check the value type in the cell
				if (typeof MatrixSolver.finishedRoutes[i].points[p].value === 'number') {
					// If it is a number, just set the point value directly
					point_value = MatrixSolver.finishedRoutes[i].points[p].value;
				} else {
					// If it is a string, evaluate the string value
					switch (MatrixSolver.finishedRoutes[i].points[p].value.toUpperCase()) {
						// "D" doubles the current point value
						case "D":
							// Set the value as the current total
							point_value = current_points;

							// Exit
							break;
						// "X" is a wall, meaning the route is invalid
						case "X":
							// Update the valid tag
							valid = false;

							// Exit
							break;
					}
				}

				// Add the points to our total
				current_points += point_value;
			}

			// Check if the route was valid (i.e. did not hit a wall)
			if (valid) {
				// Check if this route has more points than the current best
				if (current_points > MatrixSolver.bestScore) {
					// Set this route as the new current best
					MatrixSolver.bestScore = current_points;
					MatrixSolver.bestRoute = MatrixSolver.finishedRoutes[i];
				}
			}
		}
	},

	//// Create the result table
	createResultTable: function() {
		// Remove any existing table and score
		$("#result_table, #result_score").remove();

		// Create a new table and set the id
		var table = document.createElement("table");
		table.id = "result_table";
		$(table).attr("cellspacing", "20px");

		// Loop through the Matrix columns
		for (var col = 0; col < MatrixSolver.matrix.length; col++) {
			// Create a table row and add it to the table
			var tr = document.createElement("tr");
			table.appendChild(tr);

			// Loop through the Matrix rows
			for (var row = 0; row < MatrixSolver.matrix[col].length; row++) {
				// Create a table cell and set the id
				var td = document.createElement("td");
				td.id = 'cell_' + row + '_' + col;

				// Add the value into the cell
				$(td).html(typeof MatrixSolver.matrix[col][row] === "string" ?
						   MatrixSolver.matrix[col][row].toUpperCase() : 
						   MatrixSolver.matrix[col][row]);

				// Check the value of the td and add any special classes
				switch ($(td).html()) {
					// Double square
					case "D":
						// Add the double class
						$(td).addClass("double");
						
						// Exit
						break;
					// Wall
					case "X":
						// Add the wall class
						$(td).addClass("wall");
						
						// Exit
						break;
					case "F":
						// Change the html
						$(td).html('0');

						// Exit
						break;
				}

				// Add the cell to the table row
				tr.appendChild(td);
			}
		}

		// Create score element
		var score = document.createElement("div");
		score.id = "result_score";

		// Add the table to the body
		$(MatrixSolver.container).append(table);

		// Add the score to the body
		$(MatrixSolver.container).append(score);
	},

	//// Show the best route on the table
	showBestRoute: function() {
		// Check if we have a valid route
		if (MatrixSolver.bestRoute === null) {
			alert("No possible route");
			return false;
		}

		// Loop through the best route
		for (var i = 0; i < MatrixSolver.bestRoute.points.length; i++) {
			// Create a Timeout for showing the steps in the route (bind the point to keep reference)
			setTimeout(function(p_point) {
				// Add the selected class to the cell
				if ($("#cell_" + p_point.x + "_" + p_point.y).hasClass("selected")) {
					// Remove the normal selected
					$("#cell_" + p_point.x + "_" + p_point.y).removeClass("selected");

					// Set the orange selected
					$("#cell_" + p_point.x + "_" + p_point.y).addClass("o_selected");
				} else {
					// Remove the normal selected
					$("#cell_" + p_point.x + "_" + p_point.y).removeClass("o_selected");

					// Set the orange selected
					$("#cell_" + p_point.x + "_" + p_point.y).addClass("selected");
				}
			}.bind(this, MatrixSolver.bestRoute.points[i]), (i + 1) * 300);
		}

		// Show the score
		$("#result_score").html(
			"Score: " + MatrixSolver.bestScore + "<br />" +
			"Grid Size: " + MatrixSolver.size + " x " + MatrixSolver.size + "<br />" + 
			"Moves Allowed: " + MatrixSolver.movesAllowed + "<br />" +
			"Computed In " + (MatrixSolver.endTime - MatrixSolver.startTime) + " milliseconds"
		);
	}
};

// OnReady function
$(document).ready(function() {
	// Create and solve a random matrix
	MatrixSolver.randomMatrix();
});

//// Add the bind function to the Function prototype if not present
if (!Function.prototype.bind) {
	//// Set the bind prototype function
	// p_object: Caller to set as 'this' when function is executed
	Function.prototype.bind = function(p_object) {
		// Check that caller is a function
		if (typeof this !== 'function') {
			// Throw an error
			throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
		}

		// Get the slice function of an array
		var slice = [].slice;

		// Get the non-caller arguments passed in
		var args = slice.call(arguments, 1);

		// Set a reference to this
		var self = this;

		// Create a blank function
		var empty_function = function () {};
	
		// Set the bound function
		bound = function () {
			// Return the function with arguments applied to it
			return self.apply(this instanceof empty_function ? this : (p_object || {}),
								args.concat(slice.call(arguments)));   
		};

		// Set the prototype of the returned bound function to the caller's prototype
		bound.prototype = this.prototype;

		// Return the function
		return bound;
	};
};
