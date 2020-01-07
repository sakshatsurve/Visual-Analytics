function sankey_diagram(){  
      google.charts.load('current', {'packages':['sankey']});
      google.charts.setOnLoadCallback(drawChart);
    }

function sankey_for_pickup_drop() {

  if (result == null) {
    console.log("No data");
    return;
  }
  return result.reduce((results, trips) => {
    //getting the start of the trip
      var start = trips.streetnames[0];
      if (results.map(r => r[1]).includes(start)) {
        return results;
      }
    //getting the end of the trip
      let end = trips.streetnames[trips.streetnames.length-1];
      if (start === end){
        return results;
      }
      var flag = false;
      results.forEach(location => {
        if (location[0] === start && location[1] === end) {
          //updating the occurence value as those start and end points for that trip occur.
          location[2] += 1;
          flag = true;
          return;

        }
      })
      if (!flag) {
        results.push([start, end, 1]);
      }
      return results;
    }, []).sort((start, end) => end[2] - start[2]).slice(0,10);
}



function drawChart() {
  var SankeyData = new google.visualization.DataTable();
  SankeyData.addColumn('string', 'From');
  SankeyData.addColumn('string', 'To');
  SankeyData.addColumn('number', 'Freq');
  SankeyData.addRows(sankey_for_pickup_drop());

  // Sets chart options.
  var options = {
    width: 1000,
  };

  // Instantiates and draws our chart, passing in some options.
  var chart = new google.visualization.Sankey(document.getElementById('sankey_basic'));
  chart.draw(SankeyData, options);
}