var azureModels = require('azure-table-client');

exports.SubjectFollowers = azureModels.define({
    SubjectProvider:        String,
    SubjectIdentifier:      String,
    FollowerProvider:       String,
    FollowerIdentifier:     String,
    CreatedAt:              Date,
    PartitionKey: function(model) {
        return model.SubjectProvider + "_" + model.SubjectIdentifier;
    },
    RowKey: function(model) {
        return model.FollowerProvider + "_" + model.FollowerIdentifier;
    },
    TableName: function () {
        return "TimelineSubjectFollowers";
    }
});

exports.SubjectTimeline = azureModels.define({
    SubjectProvider:        String,
    SubjectIdentifier:      String,
    EventSenderProvider:    String,
    EventSenderIdentifier:  String,
    EventIdentifier:        String,
    EventType:              String,
    EventData:              String,
    EventDate:              Date,
    PartitionKey: function(model) {
        return model.SubjectProvider + "_" + model.SubjectIdentifier;
    },
    RowKey: function(model) {
        return model.EventIdentifier;
    },
    TableName: function () {
        return "TimelineSubjectTimline";
    }
});

exports.setConfig = function(azureStorageAccountKey, azureStorageAccountSecret) {
    azureModels.config(azureStorageAccountKey, azureStorageAccountSecret);
};