let municipalities = [];

// Function to determine region based on coordinates
function determineRegion(lat, lon) {
    // Western Region: roughly west of 18°E longitude
    if (lon < 18) {
        return "المنطقة الغربية";
    }
    // Eastern Region: roughly east of 18°E longitude and north of 25°N latitude
    else if (lon >= 18 && lat > 25) {
        return "المنطقة الشرقية";
    }
    // Southern Region: roughly south of 25°N latitude
    else {
        return "المنطقة الجنوبية";
    }
}

// Load data from libya_all_regions.csv - comprehensive data with regions
fetch("libya_all_regions.csv")
    .then(response => response.text())
    .then(csvText => {
        const lines = csvText.trim().split('\n');
        
        // Parse each line - format is: name,population,lat,lon,region
        municipalities = lines.slice(1).map((line, index) => {
            const parts = line.split(',');
            
            // Check if we have all required data
            if (parts.length >= 5) {
                const name = parts[0].trim();
                const population = parseInt(parts[1].trim()) || 0;
                const lat = parseFloat(parts[2].trim()) || null;
                const lon = parseFloat(parts[3].trim()) || null;
                const region = parts[4].trim();
                
                // Map Arabic region names to English
                let englishRegion;
                if (region === "المنطقة الغربية") {
                    englishRegion = "Western Region";
                } else if (region === "المنطقة الشرقية") {
                    englishRegion = "Eastern Region";
                } else if (region === "المنطقة الجنوبية") {
                    englishRegion = "Southern Region";
                } else {
                    englishRegion = "Unknown Region";
                }
                

                
                return {
                    name: name,
                    englishName: name, // Use Arabic name for both since we don't have English names
                    population: population,
                    region: englishRegion,
                    lat: lat,
                    lon: lon
                };
            } else {
                console.warn(`Line ${index + 1} has insufficient data:`, line);
                return null;
            }
        }).filter(m => m !== null && m.lat !== null && m.lon !== null); // Filter out entries without coordinates
        

        
        // Update regions object with actual Arabic names
        regions = {
            "المنطقة الغربية": municipalities.filter(m => m.region === "Western Region"),
            "المنطقة الشرقية": municipalities.filter(m => m.region === "Eastern Region"),
            "المنطقة الجنوبية": municipalities.filter(m => m.region === "Southern Region")
        };
        

        
        // Initialize the map after data is loaded
        initializeMap(municipalities);
        initializeRegionsList();
        updateStatistics();
    }).catch(error => {
        console.error("Error loading CSV:", error);
        // Fallback to hardcoded data if CSV fails
        municipalities = [
            { "name": "طرابلس المركز", "population": 180644, "region": "Western Region", "lat": 32.8757, "lon": 13.1843 },
            { "name": "بنغازي", "population": 915320, "region": "Eastern Region", "lat": 32.1167, "lon": 20.0667 },
            { "name": "سبها", "population": 202841, "region": "Southern Region", "lat": 27.0333, "lon": 14.4333 }
        ];
        regions = {
            "المنطقة الغربية": municipalities.filter(m => m.region === "Western Region"),
            "المنطقة الشرقية": municipalities.filter(m => m.region === "Eastern Region"),
            "المنطقة الجنوبية": municipalities.filter(m => m.region === "Southern Region")
        };
        initializeMap(municipalities);
        initializeRegionsList();
        updateStatistics();
    });

let regions = {
    "المنطقة الغربية": [],
    "المنطقة الشرقية": [],
    "المنطقة الجنوبية": []
};

// Calculate map dimensions based on new layout
const mapContainer = document.querySelector('.map-container');
let width = mapContainer ? mapContainer.clientWidth : Math.min(window.innerWidth * 0.7, 1000);
let height = mapContainer ? mapContainer.clientHeight : Math.min(window.innerHeight * 0.8, 700);

// Initialize global window properties for resize handling
window.width = width;
window.height = height;

// Statistics functions
function updateStatistics() {
    // Update header statistics with official numbers
    const totalMunicipalities = municipalities.length;
    const officialTotalPopulation = 8443553; // Official Libya population
    
    d3.select("#total-municipalities").text(totalMunicipalities.toLocaleString());
    d3.select("#total-population").text(officialTotalPopulation.toLocaleString());
    
    // Update region statistics
    updateRegionStatistics();
}

function updateRegionStatistics() {
    const regionStats = d3.select("#region-stats");
    const regionStatsDesktop = d3.select("#region-stats-desktop");
    
    regionStats.html("");
    regionStatsDesktop.html("");
    
    // Official population numbers by region
    const officialRegionPopulations = {
        "المنطقة الغربية": 4668121,
        "المنطقة الشرقية": 2934561,
        "المنطقة الجنوبية": 840871
    };
    
    Object.keys(regions).forEach(regionName => {
        const regionMunicipalities = regions[regionName];
        const officialPopulation = officialRegionPopulations[regionName] || 0;
        
        // Create sidebar statistics (for mobile)
        const statDiv = regionStats.append("div")
            .attr("class", "region-stat");
        
        statDiv.append("div")
            .attr("class", "region-stat-name")
            .text(regionName);
        
        const statsContainer = statDiv.append("div")
            .style("text-align", "right");
        
        statsContainer.append("div")
            .attr("class", "region-stat-count")
            .text(`${regionMunicipalities.length} بلدية`);
        
        statsContainer.append("div")
            .style("font-size", "12px")
            .style("color", "#000000")
            .text(`${officialPopulation.toLocaleString()} نسمة`);
        
        // Create desktop statistics (below map)
        const desktopStatDiv = regionStatsDesktop.append("div")
            .attr("class", "region-stat");
        
        desktopStatDiv.append("div")
            .attr("class", "region-stat-name")
            .text(regionName);
        
        const desktopStatsContainer = desktopStatDiv.append("div")
            .style("text-align", "right");
        
        desktopStatsContainer.append("div")
            .attr("class", "region-stat-count")
            .text(`${regionMunicipalities.length} بلدية`);
        
        desktopStatsContainer.append("div")
            .style("font-size", "12px")
            .style("color", "#000000")
            .text(`${officialPopulation.toLocaleString()} نسمة`);
    });
}

// Create zoom behavior with better limits
const zoomBehavior = d3.zoom()
    .scaleExtent([0.5, 8]) // Limit zoom out to 0.5 and max zoom to 8
    .translateExtent([[-width * 0.5, -height * 0.5], [width * 1.5, height * 1.5]]) // Constrain panning
    .on("zoom", handleZoom);

const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height)
    .call(zoomBehavior);

// Create a group for all map elements that will be zoomed/panned
const mapGroup = svg.append("g");

// Determine appropriate scale based on screen size
const isMobile = window.innerWidth <= 768;
const initialScale = isMobile ? 1200 : 2000;

const projection = d3.geoMercator()
    .center([17, 27])
    .scale(initialScale)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Zoom handler
function handleZoom(event) {
    mapGroup.attr("transform", event.transform);
    
    // Scale points based on zoom level for better accuracy
    const zoomLevel = event.transform.k;
    
    // Scale down points when zoomed in for better accuracy
    if (points && points.size() > 0) {
        const scaleFactor = Math.max(0.3, Math.min(2, 1 / zoomLevel));
        
        points.each(function(d) {
            const point = d3.select(this);
            const baseSize = getPointSize(d.population);
            const isSelected = point.classed("selected");
            
            if (isSelected) {
                // Keep selected points larger
                point.attr("r", (baseSize + 4) * scaleFactor)
                     .style("stroke-width", Math.max(2, 4 * scaleFactor) + "px");
            } else {
                // Normal points
                point.attr("r", baseSize * scaleFactor)
                     .style("stroke-width", Math.max(1, 1.5 * scaleFactor) + "px");
            }
        });
    }
    
    // Update any existing label lines and labels to match new zoom level
    updateLabelsForZoom(zoomLevel);
}

// Function to update existing labels and lines when zoom level changes
function updateLabelsForZoom(zoomLevel) {
    const scaleFactor = Math.max(0.3, Math.min(2, 1 / zoomLevel));
    
    // Update existing label lines
    mapGroup.selectAll(".label-line").each(function() {
        const line = d3.select(this);
        const municipality = line.datum(); // Get the stored municipality data
        
        if (municipality) {
            const baseSize = getPointSize(municipality.population);
            const actualSize = baseSize * scaleFactor;
            const projectedPos = projection([municipality.lon, municipality.lat]);
            
            line.attr("x1", projectedPos[0])
                .attr("y1", projectedPos[1]) // Start from center of dot
                .attr("x2", projectedPos[0])
                .attr("y2", projectedPos[1] - actualSize - 15)
                .style("stroke-width", Math.max(1.5, 2.5 * scaleFactor) + "px");
        }
    });
    
    // Update existing municipality labels
    mapGroup.selectAll(".municipality-label").each(function() {
        const label = d3.select(this);
        const municipality = label.datum(); // Get the stored municipality data
        
        if (municipality) {
            const baseSize = getPointSize(municipality.population);
            const actualSize = baseSize * scaleFactor;
            const projectedPos = projection([municipality.lon, municipality.lat]);
            
            label.attr("x", projectedPos[0])
                 .attr("y", projectedPos[1] - actualSize - 20)
                 .style("font-size", Math.max(12, 16 * scaleFactor) + "px");
        }
    });
}

// Zoom control functions
function zoomIn() {
    svg.transition().duration(300).call(
        zoomBehavior.scaleBy,
        1.5
    );
}

function zoomOut() {
    svg.transition().duration(300).call(
        zoomBehavior.scaleBy,
        1 / 1.5
    );
}

function resetZoom() {
    svg.transition().duration(500).call(
        zoomBehavior.transform,
        d3.zoomIdentity
    );
}

let points;

// Function to determine point size based on population
function getPointSize(population) {
    // Smaller, more subtle scaling based on population
    if (population > 500000) return 12;     // Major cities (500k+)
    if (population > 300000) return 10;     // Very large cities (300k-500k)
    if (population > 200000) return 8;      // Large cities (200k-300k)
    if (population > 100000) return 6;      // Medium cities (100k-200k)
    if (population > 50000) return 5;       // Small cities (50k-100k)
    if (population > 20000) return 4;       // Towns (20k-50k)
    if (population > 10000) return 3;       // Small towns (10k-20k)
    return 2;                               // Villages (<10k)
}

// Function to determine point color based on population (professional gradient)
function getPointColor(population) {
    // Consistent brown color for all municipality dots
    return "#3F3223";     // Brown color for all municipalities
}

// Single color for all points - size indicates population

function updateMap(data) {

    
    mapGroup.selectAll(".municipality-point").remove();
    mapGroup.selectAll(".municipality-label").remove();
    mapGroup.selectAll(".label-line").remove();

            points = mapGroup.selectAll(".municipality-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "municipality-point")
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", d => getPointSize(d.population))
        .style("fill", d => getPointColor(d.population))
        .style("stroke", "#685D4E")
        .style("stroke-width", "1.5px")
        .style("opacity", 0.85)
        .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))")
        .on("mouseover", function(event, d) {
            // Only apply hover effect if this point isn't already selected
            if (!d3.select(this).classed("selected")) {
                const currentZoom = d3.zoomTransform(svg.node()).k;
                const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                const baseSize = getPointSize(d.population);
                
                d3.select(this)
                    .attr("r", (baseSize + 2) * scaleFactor)
                    .style("stroke-width", Math.max(2, 3 * scaleFactor) + "px")
                    .style("filter", "drop-shadow(0px 3px 8px rgba(0,0,0,0.3))");
            }
        })
        .on("mouseout", function(event, d) {
            // Only reset if this point isn't selected
            if (!d3.select(this).classed("selected")) {
                const currentZoom = d3.zoomTransform(svg.node()).k;
                const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                const baseSize = getPointSize(d.population);
                
                d3.select(this)
                    .attr("r", baseSize * scaleFactor)
                    .style("stroke-width", Math.max(1, 1.5 * scaleFactor) + "px")
                    .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))");
            }
        })
        .on("click", (event, d) => {
            // Clear any region summary labels and active region styling
            mapGroup.selectAll(".region-summary-label").remove();
            d3.selectAll(".region").classed("active", false);
            
            // Reset all points to normal size and clear selected class
            const currentZoom = d3.zoomTransform(svg.node()).k;
            points.classed("selected", false);
            points.attr("r", d => {
                const baseSize = getPointSize(d.population);
                const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                return baseSize * scaleFactor;
            });
            points.style("stroke", "#685D4E");
            points.style("stroke-width", () => {
                const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                return Math.max(1, 1.5 * scaleFactor) + "px";
            });
            points.style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))");
            
            // Highlight clicked point and mark as selected
            d3.select(event.currentTarget)
                .classed("selected", true)
                .attr("r", (getPointSize(d.population) + 4) * Math.max(0.3, Math.min(2, 1 / currentZoom)))
                .style("stroke", "#000000")
                .style("stroke-width", () => {
                    const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                    return Math.max(2, 4 * scaleFactor) + "px";
                })
                .style("filter", "drop-shadow(0px 3px 8px rgba(220,38,38,0.4))");
            
            // Show municipality label with leader line
            showMunicipalityLabel(d);
            
            // Show municipality information modal
            showMunicipalityModal(d);
        });

    // No automatic labels - only show on click/search
}

function initializeMap(municipalitiesData) {
    d3.json("libya.json").then(world => {
        
        // libya.json contains administrative districts, so we'll use all features
        // Render in reverse order to prevent the last district from covering others
        world.features.slice().reverse().forEach((district, reverseIndex) => {
            mapGroup.append("path")
                .datum(district)
                .attr("class", "district-boundary")
                .attr("d", path)
                .style("fill", "#E2D3C3")
                .style("stroke", "#685D4E")
                .style("stroke-width", "1.5px")
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .style("stroke", "#000000")
                        .style("stroke-width", "2px");
                })
                .on("mouseout", function(event, d) {
                    d3.select(this)
                        .style("stroke", "#685D4E")
                        .style("stroke-width", "1.5px");
                })
        });

        // Add neighboring country labels for geographic context
        const neighboringCountries = [
            { name: "تونس", position: [9.5, 33.5], region: "northwest" },
            { name: "الجزائر", position: [5.0, 28.0], region: "west" },
            { name: "النيجر", position: [12.0, 20.0], region: "southwest" },
            { name: "تشاد", position: [18.0, 18.0], region: "south" },
            { name: "السودان", position: [28.0, 22.0], region: "southeast" },
            { name: "مصر", position: [28.0, 31.5], region: "east" }
        ];

        // Add labels for neighboring countries
        neighboringCountries.forEach(country => {
            const projectedPos = projection(country.position);
            if (projectedPos && isFinite(projectedPos[0]) && isFinite(projectedPos[1])) {
                mapGroup.append("text")
                    .attr("class", "neighbor-country-label")
                    .attr("x", projectedPos[0])
                    .attr("y", projectedPos[1])
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .style("font-size", "14px")
                    .style("font-weight", "600")
                    .style("fill", "#000000")
                    .style("opacity", "0.7")
                    .style("pointer-events", "none")
                    .text(country.name);
            }
        });

        // Now that the map is set up, update it with municipality data
        if (municipalitiesData && municipalitiesData.length > 0) {
            updateMap(municipalitiesData);
        }
    }).catch(error => {
        console.error("Error loading libya.json:", error);
    });
}

function initializeRegionsList() {
    const regionsList = d3.select("#regions-list");
    regionsList.html(""); // Clear existing content

    Object.keys(regions).forEach(region => {
        const regionDiv = regionsList.append("div");
        regionDiv.append("h3")
            .attr("class", "region")
            .text(region)
            .on("click", () => {
                // Toggle municipalities list
                const municipalitiesList = regionDiv.select(".municipalities-list");
                const isExpanded = municipalitiesList.style("display") !== "none";
                municipalitiesList.style("display", isExpanded ? "none" : "block");
                
                // Toggle region highlighting
                if (isExpanded) {
                    // If list was expanded, unhighlight the region
                    unhighlightRegion();
                } else {
                    // If list was collapsed, highlight the region
                    highlightRegion(region);
                }
            });

        const municipalitiesList = regionDiv.append("div")
            .attr("class", "municipalities-list")
            .style("display", "none");

        regions[region].forEach(municipality => {
            municipalitiesList.append("div")
                .attr("class", "municipality-list-item")
                .text(municipality.name)
                .on("click", () => {
                    // Clear any region summary labels and active region styling
                    mapGroup.selectAll(".region-summary-label").remove();
                    d3.selectAll(".region").classed("active", false);
                    
                    // Reset all points to normal style (accounting for current zoom)
                    const currentZoom = d3.zoomTransform(svg.node()).k;
                    points.attr("r", d => {
                        const baseSize = getPointSize(d.population);
                        const scaleFactor = Math.max(0.3, 1 / currentZoom);
                        return baseSize * scaleFactor;
                    });
                    points.style("stroke", "#685D4E");
                    points.style("stroke-width", () => {
                        const scaleFactor = Math.max(0.3, 1 / currentZoom);
                        return Math.max(1, 1.5 * scaleFactor) + "px";
                    });
                    
                    // Highlight the selected point
                    const point = points.filter(p => p.name === municipality.name);
                    point.attr("r", (getPointSize(municipality.population) + 4) * Math.max(0.3, 1 / currentZoom));
                    point.style("stroke", "#000000");
                    point.style("stroke-width", () => {
                        const scaleFactor = Math.max(0.3, 1 / currentZoom);
                        return Math.max(1, 3 * scaleFactor) + "px";
                    });
                    
                    // Show municipality label with leader line
                    showMunicipalityLabel(municipality);
                    
                    // Show municipality information modal
                    showMunicipalityModal(municipality);
                });
        });
    });
}

// Filter button event listeners
d3.select("#large-municipalities").on("click", function() {
    // Update button states
    d3.selectAll(".btn-filter").classed("active", false);
    d3.select(this).classed("active", true);
    
    const largest = municipalities.sort((a, b) => b.population - a.population).slice(0, 20);
    updateMap(largest);
});

d3.select("#all-municipalities").on("click", function() {
    // Update button states
    d3.selectAll(".btn-filter").classed("active", false);
    d3.select(this).classed("active", true);
    
    updateMap(municipalities);
});

// Zoom control event listeners
d3.select("#zoom-in").on("click", zoomIn);
d3.select("#zoom-out").on("click", zoomOut);
d3.select("#reset-zoom").on("click", resetZoom);

// Search functionality
function performSearch(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
        d3.select("#search-results").html("");
        return;
    }
    
    const term = searchTerm.trim().toLowerCase();
    const results = municipalities.filter(municipality => 
        municipality.name.toLowerCase().includes(term)
    );
    
    displaySearchResults(results);
}

function displaySearchResults(results) {
    const resultsContainer = d3.select("#search-results");
    
    if (results.length === 0) {
        resultsContainer.html("<div class='search-result-item'>لم يتم العثور على نتائج</div>");
        return;
    }
    
    resultsContainer.html("");
    
    results.forEach(municipality => {
        const resultItem = resultsContainer.append("div")
            .attr("class", "search-result-item")
            .on("click", () => {
                highlightMunicipality(municipality);
                showMunicipalityModal(municipality);
            });
        
        resultItem.append("div")
            .attr("class", "municipality-name")
            .text(municipality.name);
        
        // Convert region to Arabic for display
        let regionDisplayName;
        if (municipality.region === "Western Region") {
            regionDisplayName = "المنطقة الغربية";
        } else if (municipality.region === "Eastern Region") {
            regionDisplayName = "المنطقة الشرقية";
        } else if (municipality.region === "Southern Region") {
            regionDisplayName = "المنطقة الجنوبية";
        } else {
            regionDisplayName = municipality.region;
        }
        
        resultItem.append("div")
            .attr("class", "municipality-details")
            .text(`${regionDisplayName} - عدد السكان: ${municipality.population.toLocaleString()}`);
    });
}

function highlightMunicipality(municipality) {
    // Clear any region summary labels and active region styling
    mapGroup.selectAll(".region-summary-label").remove();
    d3.selectAll(".region").classed("active", false);
    
    // Reset all points to their original size and style (accounting for current zoom)
    const currentZoom = d3.zoomTransform(svg.node()).k;
    points.attr("r", d => {
        const baseSize = getPointSize(d.population);
        const scaleFactor = Math.max(0.3, 1 / currentZoom);
        return baseSize * scaleFactor;
    });
    points.style("stroke", "#685D4E");
    points.style("stroke-width", () => {
        const scaleFactor = Math.max(0.3, 1 / currentZoom);
        return Math.max(1, 1.5 * scaleFactor) + "px";
    });
    
    // Remove any existing labels and lines
    mapGroup.selectAll(".municipality-label").remove();
    mapGroup.selectAll(".label-line").remove();
    mapGroup.selectAll(".population-label").remove();
    
    // Highlight the selected municipality
    const selectedPoint = points.filter(p => p.name === municipality.name);
    
    // Make point larger and highlight it
    selectedPoint.attr("r", (getPointSize(municipality.population) + 4) * Math.max(0.3, 1 / currentZoom));
    selectedPoint.style("stroke", "#000000");
    selectedPoint.style("stroke-width", () => {
        const scaleFactor = Math.max(0.3, 1 / currentZoom);
        return Math.max(1, 3 * scaleFactor) + "px";
    });
    
    // Show municipality label with leader line
    showMunicipalityLabel(municipality);
    
    // Pan to the municipality if it's not visible
    const pointX = projection([municipality.lon, municipality.lat])[0];
    const pointY = projection([municipality.lon, municipality.lat])[1];
    
    // Get the current map container dimensions
    const mapContainer = document.querySelector('.map-container');
    const mapRect = mapContainer.getBoundingClientRect();
    const currentWidth = mapRect.width;
    const currentHeight = mapRect.height;
    
    // Check if point is within current viewport
    const currentTransform = d3.zoomTransform(svg.node());
    const transformedX = pointX * currentTransform.k + currentTransform.x;
    const transformedY = pointY * currentTransform.k + currentTransform.y;
    
    // Check if the transformed point is visible within the map container
    const margin = 50; // Add some margin to ensure point is clearly visible
    const isVisible = transformedX >= margin && 
                     transformedX <= currentWidth - margin && 
                     transformedY >= margin && 
                     transformedY <= currentHeight - margin;
    
    if (!isVisible) {
        // Scroll to top on desktop to ensure map is visible
        if (window.innerWidth > 768) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Close mobile menu on mobile devices
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.add('collapsed');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Pan to center the municipality
        const centerX = currentWidth / 2 - pointX * currentTransform.k;
        const centerY = currentHeight / 2 - pointY * currentTransform.k;
        
        svg.transition().duration(500).call(
            zoomBehavior.transform,
            d3.zoomIdentity.translate(centerX, centerY).scale(currentTransform.k)
        );
    }
}



// Search event listeners
d3.select("#search-button").on("click", () => {
    const searchTerm = d3.select("#search-input").property("value");
    performSearch(searchTerm);
});

d3.select("#search-input").on("keypress", (event) => {
    if (event.key === "Enter") {
        const searchTerm = d3.select("#search-input").property("value");
        performSearch(searchTerm);
    }
});

// Clear search results when input is cleared
d3.select("#search-input").on("input", (event) => {
    if (event.target.value === "") {
        d3.select("#search-results").html("");
    }
});

// Function to show label for a specific municipality
function showMunicipalityLabel(municipality) {
    // Remove any existing labels first
    mapGroup.selectAll(".municipality-label").remove();
    mapGroup.selectAll(".label-line").remove();
    
    // Get current zoom level and calculate proper positioning
    const currentZoom = d3.zoomTransform(svg.node()).k;
    const baseSize = getPointSize(municipality.population);
    const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
    const actualSize = baseSize * scaleFactor;
    
    // Create leader line - starting from center of dot
    const line = mapGroup.append("line")
        .datum(municipality) // Store municipality data with the line
        .attr("class", "label-line")
        .attr("x1", projection([municipality.lon, municipality.lat])[0])
        .attr("y1", projection([municipality.lon, municipality.lat])[1]) // Start from center of dot
        .attr("x2", projection([municipality.lon, municipality.lat])[0])
        .attr("y2", projection([municipality.lon, municipality.lat])[1] - actualSize - 15) // End above the dot
        .style("stroke", "#685D4E")
        .style("stroke-width", Math.max(1.5, 2.5 * scaleFactor) + "px")
        .style("opacity", 0.9)
        .style("stroke-linecap", "round");

    // Create label - positioned above the leader line
    const label = mapGroup.append("text")
        .datum(municipality) // Store municipality data with the label
        .attr("class", "municipality-label")
        .attr("x", projection([municipality.lon, municipality.lat])[0])
        .attr("y", projection([municipality.lon, municipality.lat])[1] - actualSize - 20) // Position above the line
        .style("font-size", Math.max(12, 16 * scaleFactor) + "px") // Scale font size with zoom
        .style("fill", "#000000")
        .style("font-family", "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
        .style("pointer-events", "none")
        .style("text-anchor", "middle")
        .style("font-weight", "600")
        .style("text-shadow", "0 1px 3px rgba(255,255,255,0.8)")
        .text(municipality.name);
}

// Function to hide all labels
function hideAllLabels() {
    mapGroup.selectAll(".municipality-label").remove();
    mapGroup.selectAll(".label-line").remove();
}

// Function to unhighlight all regions and reset points to normal
function unhighlightRegion() {
    // Remove active class from all region headers
    d3.selectAll(".region").classed("active", false);
    
    // Reset all points to normal style (accounting for current zoom)
    const currentZoom = d3.zoomTransform(svg.node()).k;
    points.attr("r", d => {
        const baseSize = getPointSize(d.population);
        const scaleFactor = Math.max(0.3, 1 / currentZoom);
        return baseSize * scaleFactor;
    });
    points.style("stroke", "#685D4E");
    points.style("stroke-width", () => {
        const scaleFactor = Math.max(0.3, 1 / currentZoom);
        return Math.max(1, 1.5 * scaleFactor) + "px";
    });
    
    // Remove any existing labels and lines
    mapGroup.selectAll(".municipality-label").remove();
    mapGroup.selectAll(".label-line").remove();
    mapGroup.selectAll(".population-label").remove();
    mapGroup.selectAll(".region-summary-label").remove();
    
    // Hide region info box
    hideRegionInfoBox();
}

// Function to highlight all municipalities in a region
function highlightRegion(regionName) {
    // Remove active class from all region headers
    d3.selectAll(".region").classed("active", false);
    
    // Add active class to the clicked region header
    d3.selectAll(".region").filter(function() {
        return d3.select(this).text() === regionName;
    }).classed("active", true);
    
    // Reset all points to normal style (accounting for current zoom)
    const currentZoom = d3.zoomTransform(svg.node()).k;
    points.attr("r", d => {
        const baseSize = getPointSize(d.population);
        const scaleFactor = Math.max(0.3, 1 / currentZoom);
        return baseSize * scaleFactor;
    });
    points.style("stroke", "#685D4E");
    points.style("stroke-width", () => {
        const scaleFactor = Math.max(0.3, 1 / currentZoom);
        return Math.max(1, 1.5 * scaleFactor) + "px";
    });
    
    // Remove any existing labels and lines
    mapGroup.selectAll(".municipality-label").remove();
    mapGroup.selectAll(".label-line").remove();
    mapGroup.selectAll(".population-label").remove();
    
    // Get municipalities in the selected region
    const regionMunicipalities = regions[regionName];
    
    // Highlight all points in the region
    regionMunicipalities.forEach(municipality => {
        const point = points.filter(p => p.name === municipality.name);
        if (point.size() > 0) {
            point.style("stroke", "#000000");
            point.style("stroke-width", () => {
                const scaleFactor = Math.max(0.3, 1 / currentZoom);
                return Math.max(1, 3 * scaleFactor) + "px";
            });
        }
    });
    
    // Show region info box
    showRegionInfoBox(regionName, regionMunicipalities);
    
    // Pan to center the region if needed
    const regionBounds = d3.extent(regionMunicipalities, d => d.lon);
    const regionLatBounds = d3.extent(regionMunicipalities, d => d.lat);
    
    if (regionBounds[0] && regionBounds[1] && regionLatBounds[0] && regionLatBounds[1]) {
        const centerX = (regionBounds[0] + regionBounds[1]) / 2;
        const centerY = (regionLatBounds[0] + regionLatBounds[1]) / 2;
        
        const pointX = projection([centerX, centerY])[0];
        const pointY = projection([centerX, centerY])[1];
        
        // Check if region is within current viewport
        const currentTransform = d3.zoomTransform(svg.node());
        const viewportWidth = width / currentTransform.k;
        const viewportHeight = height / currentTransform.k;
        
        if (pointX < 0 || pointX > viewportWidth || pointY < 0 || pointY > viewportHeight) {
            // Pan to center the region
            const panX = width / 2 - pointX * currentTransform.k;
            const panY = height / 2 - pointY * currentTransform.k;
            
            svg.transition().duration(500).call(
                zoomBehavior.transform,
                d3.zoomIdentity.translate(panX, panY).scale(currentTransform.k)
            );
        }
    }
}

// Modal functionality
function showMunicipalityModal(municipality) {
    // Populate modal content
    d3.select("#modal-title").text(municipality.name);
    d3.select("#modal-arabic-name").text(municipality.name);
    d3.select("#modal-population").text(municipality.population.toLocaleString());
    
    // Convert internal region name to Arabic display name
    let regionDisplayName;
    if (municipality.region === "Western Region") {
        regionDisplayName = "المنطقة الغربية";
    } else if (municipality.region === "Eastern Region") {
        regionDisplayName = "المنطقة الشرقية";
    } else if (municipality.region === "Southern Region") {
        regionDisplayName = "المنطقة الجنوبية";
    } else {
        regionDisplayName = municipality.region;
    }
    d3.select("#modal-region").text(regionDisplayName);
    
    // Show modal
    d3.select("#municipality-modal").style("display", "block");
    
    // Store current municipality for zoom functionality
    window.currentMunicipality = municipality;
}

function getPopulationCategory(population) {
    if (population > 500000) return "Major City (500,000+)";
    if (population > 200000) return "Large City (200,000+)";
    if (population > 100000) return "Medium City (100,000+)";
    if (population > 50000) return "Small City (50,000+)";
    return "Town (<50,000)";
}

function closeMunicipalityModal() {
    d3.select("#municipality-modal").style("display", "none");
    
    // Reset point highlighting
    if (points) {
        points.attr("r", d => getPointSize(d.population));
    }
}

// Modal event listeners
d3.select(".close").on("click", closeMunicipalityModal);
d3.select("#modal-close").on("click", closeMunicipalityModal);

// Close modal when clicking outside
d3.select("#municipality-modal").on("click", function(event) {
    if (event.target === this) {
        closeMunicipalityModal();
    }
});

// Zoom to location button
d3.select("#modal-zoom-to").on("click", function() {
    if (window.currentMunicipality) {
        const municipality = window.currentMunicipality;
        
        // Get the projected coordinates
        const [x, y] = projection([municipality.lon, municipality.lat]);
        
        // Get the current map container dimensions and position
        const mapContainer = document.querySelector('.map-container');
        const mapRect = mapContainer.getBoundingClientRect();
        const currentWidth = mapRect.width;
        const currentHeight = mapRect.height;
        
        // Calculate the transform to center and zoom to the municipality
        const scale = 4; // Zoom level
        const translate = [currentWidth / 2 - scale * x, currentHeight / 2 - scale * y];
        
        // Scroll to top to ensure map is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Close mobile menu on mobile devices
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.add('collapsed');
            }
        }
        
        // Apply the zoom transform with a delay to ensure scroll completes
        setTimeout(() => {
            svg.transition().duration(1000).call(
                zoomBehavior.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        }, 500);
        
        // Close modal after zooming
        closeMunicipalityModal();
    }
});

// Handle window resize for responsive map
window.addEventListener('resize', function() {
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer && svg) {
        const newWidth = mapContainer.clientWidth;
        const newHeight = mapContainer.clientHeight;
        const newIsMobile = window.innerWidth <= 768;
        
        // Store current transform before making changes
        const currentTransform = d3.zoomTransform(svg.node());
        
        // Update SVG dimensions
        svg.attr("width", newWidth)
           .attr("height", newHeight);
        
        // Update zoom behavior translate extent with new dimensions
        zoomBehavior.translateExtent([[-newWidth * 0.5, -newHeight * 0.5], [newWidth * 1.5, newHeight * 1.5]]);
        
        // Calculate the center offset change
        const oldCenterX = width / 2;
        const oldCenterY = height / 2;
        const newCenterX = newWidth / 2;
        const newCenterY = newHeight / 2;
        const centerOffsetX = newCenterX - oldCenterX;
        const centerOffsetY = newCenterY - oldCenterY;
        
        // Adjust scale based on screen size
        const newScale = newIsMobile ? 1200 : 2000;
        const oldScale = projection.scale();
        const scaleRatio = newScale / oldScale;
        
        // Update projection with new scale and translation
        projection.scale(newScale)
                  .translate([newCenterX, newCenterY]);
        
        // Preserve the current zoom state by adjusting the transform
        // Account for both the scale change and center offset
        const newTransform = d3.zoomIdentity
            .translate(
                currentTransform.x * scaleRatio + centerOffsetX,
                currentTransform.y * scaleRatio + centerOffsetY
            )
            .scale(currentTransform.k);
        
        // Apply the adjusted transform
        svg.call(zoomBehavior.transform, newTransform);
        
        // Update any existing municipality labels and label lines
        mapGroup.selectAll(".municipality-label")
            .attr("x", d => projection([d.lon, d.lat])[0])
            .attr("y", d => {
                const currentZoom = d3.zoomTransform(svg.node()).k;
                const baseSize = getPointSize(d.population);
                const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                const actualSize = baseSize * scaleFactor;
                return projection([d.lon, d.lat])[1] - actualSize - 20;
            })
            .style("font-size", d => {
                const currentZoom = d3.zoomTransform(svg.node()).k;
                const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                return Math.max(12, 16 * scaleFactor) + "px";
            });
        
        // Update label lines
        mapGroup.selectAll(".label-line")
            .attr("x1", d => projection([d.lon, d.lat])[0])
            .attr("y1", d => projection([d.lon, d.lat])[1])
            .attr("x2", d => projection([d.lon, d.lat])[0])
            .attr("y2", d => {
                const currentZoom = d3.zoomTransform(svg.node()).k;
                const baseSize = getPointSize(d.population);
                const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                const actualSize = baseSize * scaleFactor;
                return projection([d.lon, d.lat])[1] - actualSize - 15;
            })
            .style("stroke-width", d => {
                const currentZoom = d3.zoomTransform(svg.node()).k;
                const scaleFactor = Math.max(0.3, Math.min(2, 1 / currentZoom));
                return Math.max(1.5, 2.5 * scaleFactor) + "px";
            });
        
        // Update global width/height variables for future calculations
        width = newWidth;
        height = newHeight;
        window.width = newWidth;
        window.height = newHeight;
    }
});

// Mobile sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
        
        // Auto-collapse sidebar on mobile by default
        function checkMobileCollapse() {
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
            } else {
                sidebar.classList.remove('collapsed');
            }
        }
        
        // Check on load and resize
        checkMobileCollapse();
        window.addEventListener('resize', checkMobileCollapse);
    }
});

// Region Info Box Functions
function showRegionInfoBox(regionName, municipalities) {
    const regionInfoBox = document.getElementById('region-info-box');
    const regionTitle = document.getElementById('region-info-title');
    const municipalitiesCount = document.getElementById('region-municipalities-count');
    const populationTotal = document.getElementById('region-population-total');
    
    // Calculate total population for the region
    const totalPopulation = municipalities.reduce((sum, municipality) => sum + (municipality.population || 0), 0);
    
    // Update content
    regionTitle.textContent = regionName;
    municipalitiesCount.textContent = municipalities.length.toLocaleString();
    populationTotal.textContent = totalPopulation.toLocaleString() + ' نسمة';
    
    // Show the box
    regionInfoBox.style.display = 'block';
    
    // Add close button functionality
    const closeButton = document.getElementById('region-info-close');
    closeButton.onclick = function() {
        hideRegionInfoBox();
        unhighlightRegion();
    };
}

function hideRegionInfoBox() {
    const regionInfoBox = document.getElementById('region-info-box');
    regionInfoBox.style.display = 'none';
}