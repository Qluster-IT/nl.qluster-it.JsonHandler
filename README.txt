Lightweight app for creating, manipulating and retrieving JSON objects.
You can alter a existing JSON object, or one will be created.
No need to pre-define the structure.

You can, for example, use the output JSON token as HomeyScript argument, and use JSON.parse(args[0]) to read the object you created.

Paths are handled through the node module jsonpath, see https://www.npmjs.com/package/jsonpath for examples.
(When the root element is not added, it will be automaticly inserted, no need for $.)

Take a look at the forum topic for usages and examples.

If you have a feature request, leave a message on the topic.

More coming.