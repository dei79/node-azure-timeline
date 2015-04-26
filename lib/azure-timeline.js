var azureModels = require('./azure-timeline-data-models.js');
var uuid        = require('node-uuid');
var q           = require('q');

/*
    This class reflects a single event in the system
 */
function AzureTimelineServiceEvent(owner, eventType, eventData, optionalIdentifier, optionalDate) {
    var self = this;

    self.Owner      = owner;
    self.Type       = eventType;
    self.Data       = eventData;
    self.Identifier = optionalIdentifier  === undefined || optionalIdentifier === null ? uuid.v4() : optionalIdentifier;
    self.Date       = optionalDate === undefined ||optionalDate === null ? new Date() : optionalDate;
}

/*
    This class reflects a subject in the system. Every subject is mainly identified by
    the combination of an identity provider and an unique identifier. Normally it's a
    person but it could be a machine account as well.
 */
function AzureTimelineServiceSubject(identityProvider, subjectIdentifier, timelineService) {
    var self = this;

    // The identifier of the subject
    self.Identifier = subjectIdentifier;
    self.Provider = identityProvider;

    // Operations

    /*
     * Sends a new event to the timeline of this subject and all followers
     * in the system.
     */
    self.postEvent = function(eventType, eventData) {

        // create the event
        var event = timelineService.buildEvent(self, eventType, eventData);

        // post the event to my own timeline
        return timelineService.postEventToSpecificSubject(self, event).then(function() {

            // get all followers are following me
            return timelineService.loadFollowers(self).then(function(followers) {

                // post the event also to the timeline of this followers
                var promisses = [];
                followers.forEach(function(follower) {
                    promisses.push(timelineService.postEventToSpecificSubject(follower, event));
                });

                // done
                return q.all(promisses);
            })
        });
    };

    /*
     * loads the timeline of this subject
     */
    self.loadTimeline = function() {
        return timelineService.loadTimeline(self);
    };

    /*
     * This method allows to follow a specific subject. This means all events
     * this subject is posting in the future will be stored on my timeline.
     */
    self.follow = function(subjectToFollow) {
        return timelineService.createRelationShip(self, subjectToFollow);
    };

    /*
     * Loads the followers of the subject
     */
    self.loadFollowers = function() {
        return timelineService.loadFollowers(self);
    }
}

function AzureTimelineService() {
    var self = this;

    /*
        Defines the Microsoft Azure Storage which is used for the timelines
     */
    self.setConfiguration = function(azureStorageAccountKey, azureStorageAccountSecret) {
        azureModels.setConfig(azureStorageAccountKey, azureStorageAccountSecret);
    };

    self.createSubject = function(identityProvider, subjectIdentifier) {
        return new AzureTimelineServiceSubject(identityProvider, subjectIdentifier, self);
    };

    self.createRelationShip = function(subjectOrigin, subjectToFollow) {
        // build the following model
        var relationship = azureModels.SubjectFollowers.build({
            SubjectProvider:    subjectToFollow.Provider,
            SubjectIdentifier:  subjectToFollow.Identifier,
            FollowerProvider:   subjectOrigin.Provider,
            FollowerIdentifier: subjectOrigin.Identifier,
            CreatedAt:          new Date()});

        // store the relation ship
        return relationship.insert();
    };

    self.buildEvent = function(owner, eventType, eventData, optionalIdentifier, optionalDate) {
        return new AzureTimelineServiceEvent(owner, eventType, eventData, optionalIdentifier, optionalDate);
    };

    self.postEventToSpecificSubject = function(subject, event) {

        // generates a new timeline value
        var eventOnTimeline = azureModels.SubjectTimeline.build({
            SubjectProvider:        subject.Provider,
            SubjectIdentifier:      subject.Identifier,
            EventSenderProvider:    event.Owner.Provider,
            EventSenderIdentifier:  event.Owner.Identifier,
            EventIdentifier:        event.Identifier,
            EventType:              event.Type,
            EventData:              JSON.stringify(event.Data),
            EventDate:              event.Date
        });

        // stores the value
        return eventOnTimeline.insert();
    };

    self.loadFollowers = function(subject) {
        var defered = q.defer();

        azureModels.SubjectFollowers.query(subject.Provider + "_" + subject.Identifier).then(function(followers) {

            var resultSubjects = followers.map(function(subjectModel) {
                return self.createSubject(subjectModel.FollowerProvider, subjectModel.FollowerIdentifier);
            });


            defered.resolve(resultSubjects);
        }).catch(function(error) {
            defered.reject(error)
        });

        return defered.promise;
    };

    self.loadTimeline = function(subject) {
        var defered = q.defer();

        azureModels.SubjectTimeline.query(subject.Provider + "_" + subject.Identifier).then(function(events) {

            var resultEvents = events.map(function(eventModel) {
                // get the owner model
                var owner = self.createSubject(eventModel.EventSenderProvider, eventModel.EventSenderIdentifier);

                // build the event
                return self.buildEvent(owner, eventModel.EventType,eventModel.EventData, eventModel.EventIdentifier, new Date(eventModel.EventDate));
            });

            // done
            defered.resolve(resultEvents);
        }).catch(function(error) {
            defered.reject(error);
        });

        return defered.promise;
    }
}



// expose the service class
module.exports = exports = new AzureTimelineService();

