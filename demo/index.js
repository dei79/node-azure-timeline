var azureTimelineService = require('../lib/azure-timeline.js');

// configure timeline service
azureTimelineService.setConfiguration("<<ACCOUNT>>", "<<SECRET>>");

// This user is a normal user
var user01 = azureTimelineService.createSubject("FAKE", "User01");

// This user is a normal user
var user02 = azureTimelineService.createSubject("FAKE", "user02");

// The system observer follows the user but only for logins
user02.follow(user01).then(function() {

    // Now the user01 logins
    user01.postEvent('login', { timestamp: new Date() }).then(function(){

        // load all events of the loginobservers timeline (the last page)
        return user02.loadTimeline().then(function(events) {
            // print out
            events.forEach(function(event) {
                console.log("Owner: " + event.Owner.Identifier + " Type:" + event.Type + " Data: " + JSON.stringify(event.Data));
            });
        });
    })
});




