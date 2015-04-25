# node-azure-timline
A timeline service to build your own twitter with azure tables.

* Service allows a subject to post an event postEventBySubject(subject, eventMessage)

* Service allows to query all events of one subjects queryEventsOfSubject(subject, options)
  * Will return ordered by eventDate
  * Query gets the following other optional parameters
     {
        startDate: StartDate we want to events for
        filterBySender: senderSubject
     }

* Service allows subject to follow other subjects: followSubject(subject, subjectToFollow)

* Service allows to build stat jobs

  * stats framework so not to deak with Azure Table at all

  * countEventTypes(statResultTable, eventTypeId, timeSlice, startDate) -> Counts the amount of a specific eventTypeId over a specific timeSlice e.g. 24hrs)
    --> ends up in a new table with the structure { timeSliceDate, eventTypeId, countValue }



