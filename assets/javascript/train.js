function ScheduleObj(name, dest, time, freq) {
  let timeArray = splitTime(time);

  this.TrainName = name;
  this.Destination = dest;
  this.FirstTrainHour = timeArray[0];
  this.FirstTrainMinutes = timeArray[1];
  this.Frequency = freq;
}

function splitTime(time) {
  return timeArray = time.split(":");
}

///FIREBASE SECTION
// Initialize Firebase
const config = {
  apiKey: "AIzaSyCRwZq1p_fN6KpzRmg09QMovQAxjvIj0DU",
  authDomain: "ucla-train.firebaseapp.com",
  databaseURL: "https://ucla-train.firebaseio.com",
  projectId: "ucla-train",
  storageBucket: "ucla-train.appspot.com",
  messagingSenderId: "664171643223"
};

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

database.ref("/trains").on("value", function(snap) {
  if (snap) {
    $(".hideable").show();
    
    let headerString = "<tr><th>Train Name</th><th>Destination</th><th>Frequency (min)</th><th>Next Arrival</th><th>Minutes Away</th></tr>";

    $("#tblSchedule").empty();
    $("#tblSchedule").append(headerString);

    snap.forEach(function(childSnap) {
      let startHour = childSnap.val().FirstTrainHour;
      let startMinutes = childSnap.val().FirstTrainMinutes;
      let trainFrequency = childSnap.val().Frequency;
      let currentDate = new Date();
      
      currentDate.setSeconds(00);

      let startDate = new Date();

      startDate.setHours(startHour);
      startDate.setMinutes(startMinutes);
      startDate.setSeconds(00);

      let currentMinutes = moment(currentDate).unix() * 60;
      let startUnixMinutes = moment(startDate).unix() * 60;

      let minutesAway = trainFrequency - ((currentMinutes - startUnixMinutes) % trainFrequency);
      let nextArrival = currentDate.getHours() >= 12 ? (currentDate.getHours() - 12) + ":" + (currentDate.getMinutes() + minutesAway) + " PM" : currentDate.getHours() + ":" + (currentDate.getMinutes() + minutesAway + " AM");
      let rowString = `<tr><td>${childSnap.val().TrainName}</td><td>${childSnap.val().Destination}</td><td>${childSnap.val().Frequency}</td><td>${nextArrival}</td><td>${minutesAway}</td></tr>`;

      $("#tblSchedule").append(rowString);

      console.log(rowString);
    });
  }
});

$(document).ready(function() {
  let nowDate = new Date();

  $("#headerTime").html(nowDate.getMonth() + "/" + nowDate.getDate() + "/" + nowDate.getFullYear() + " - " + nowDate.getHours() + ":" + nowDate.getMinutes());
  $("#btnSubmit").on("click", function(event) {
    event.preventDefault();

    let trainName = $("#txtTrainName").val().trim();
    let trainDestination = $("#txtDestination").val().trim();
    let trainTime = $("#txtTrainTime").val().trim();
    let trainFrequency = parseInt($("#txtFrequency").val().trim());

    //name, dest, time, freq
    let trainSched = new ScheduleObj(trainName, trainDestination, trainTime, trainFrequency);

    // Get a key for the current schedule.
    currentSched = firebase.database().ref().push().key;

    // Write the new post's data simultaneously in the posts list and the user's post list.
    let updates = {};

    // Add the schedule to an array with a path to the trains node in Firebase
    updates['/trains/' + currentSched] = trainSched;

    // Add the player to the database
    firebase.database().ref().update(updates);
  });
});