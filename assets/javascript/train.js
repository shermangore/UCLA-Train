function ScheduleObj(name, dest, time, freq) {
  let timeArray = splitTime(time);

  this.TrainName = name;
  this.Destination = dest;
  this.FirstTrainHour = timeArray[0];
  this.FirstTrainMinutes = timeArray[1];
  this.Frequency = freq;
}

// Function to split the input time into hours and minutes
function splitTime(time) {
  return timeArray = time.split(":");
}

///FIREBASE SECTION
const config = {
  apiKey: "AIzaSyCRwZq1p_fN6KpzRmg09QMovQAxjvIj0DU",
  authDomain: "ucla-train.firebaseapp.com",
  databaseURL: "https://ucla-train.firebaseio.com",
  projectId: "ucla-train",
  storageBucket: "ucla-train.appspot.com",
  messagingSenderId: "664171643223"
};

// Initialize Firebase
firebase.initializeApp(config);

// Get a reference to the database service
let database = firebase.database();

let connectionsRef = database.ref("/connections");

// '.info/connected' is a special location provided by Firebase that is updated every time
// the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
let connectedRef = database.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function(snap) {
  // If they are connected..
  if (snap.val()) {
    // Add user to the connections list.
    let con = connectionsRef.push(true);

    // Remove user from the connection list when they disconnect.
    con.onDisconnect().remove(function(event) {
    	//currentUser.remove();
    });
  }
});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function(snap) {

});

// Whenever the values in the "trains" node change, do this
database.ref("/trains").on("value", function(snap) {
  // If a value is in the snap parameter
  if (snap) {
    // Show the div containing the schedule
    $(".hideable").show();
    
    // Create a header string
    let headerString = "<tr><th>Train Name</th><th>Destination</th><th>Frequency (min)</th><th>Next Arrival</th><th>Minutes Away</th></tr>";

    // Empty the table in preparation of refilling it with updated data
    $("#tblSchedule").empty();

    // Add the header
    $("#tblSchedule").append(headerString);

    // Run a loop of all of the schedules in the train node
    snap.forEach(function(childSnap) {
      // Set variables for each of the data node values
      let startHour = childSnap.val().FirstTrainHour;
      let startMinutes = childSnap.val().FirstTrainMinutes;
      let trainFrequency = childSnap.val().Frequency;
      
      // Create a variable to hold the current date and time
      let currentDate = new Date();
      
      // Set the seconds to zero for easier calculations
      currentDate.setSeconds(00);

      // Get the current date and time, which will be used to set the First Train Time hour and minutes for calculation purposes
      let startDate = new Date();

      // Set the hour and minutes to what is saved in the db
      startDate.setHours(startHour);
      startDate.setMinutes(startMinutes);
      startDate.setSeconds(00); // Set the seconds to zero for easier calculations

      // Get the number of minutes since 01/01/1970
      let currentMinutes = moment(currentDate).unix() * 60;
      let startUnixMinutes = moment(startDate).unix() * 60;

      // How many minutes away is the train?
      let minutesAway = trainFrequency - ((currentMinutes - startUnixMinutes) % trainFrequency);

      // What time will the train arrive?
      let nextArrival = currentDate.getHours() >= 12 ? (currentDate.getHours() - 12) + ":" + (currentDate.getMinutes() + minutesAway) + " PM" : currentDate.getHours() + ":" + (currentDate.getMinutes() + minutesAway + " AM");

      // Create an html string to populate the table with schedule values
      let rowString = `<tr><td>${childSnap.val().TrainName}</td><td>${childSnap.val().Destination}</td><td>${childSnap.val().Frequency}</td><td>${nextArrival}</td><td>${minutesAway}</td></tr>`;

      // Append the schedule values to the table
      $("#tblSchedule").append(rowString);
    });
  }
});

$(document).ready(function() {
  // Get the current date to populate the display time on the page
  let nowDate = new Date();

  // Display the time
  $("#headerTime").html(nowDate.getMonth() + "/" + nowDate.getDate() + "/" + nowDate.getFullYear() + " - " + nowDate.getHours() + ":" + nowDate.getMinutes());

  // When the user clicks the submit button, do all this stuff
  $("#btnSubmit").on("click", function(event) {
    // Don't let that page submit!!!
    event.preventDefault();

    // Create variables to store all of the input values
    let trainName = $("#txtTrainName").val().trim();
    let trainDestination = $("#txtDestination").val().trim();
    let trainTime = $("#txtTrainTime").val().trim();
    let trainFrequency = parseInt($("#txtFrequency").val().trim());

    // Create a new ScheduleObj object with the following data
    //  name, dest, time, freq
    let trainSched = new ScheduleObj(trainName, trainDestination, trainTime, trainFrequency);

    // Get a key for the current schedule.
    currentSched = firebase.database().ref().push().key;

    // Write the new post's data simultaneously in the posts list and the user's post list.
    let updates = {};

    // Add the schedule to an array with a path to the trains node in Firebase
    updates['/trains/' + currentSched] = trainSched;

    // Add the player to the database
    firebase.database().ref().update(updates);

    // Clear the inputs
    $("#txtTrainName").val('');
    $("#txtDestination").val('');
    $("#txtTrainTime").val('');
    $("#txtFrequency").val('')
  });
});