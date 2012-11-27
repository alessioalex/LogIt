![print screen](https://raw.github.com/alessioalex/LogIt/master/examples/streamingLogs/files/streamingLogs.png)

## Description

This example show you how to stream logs in browser using Server Side Events (SSE).
Every 5 seconds the server will send a JSON message to all connected clients.
The message will contain the memory usage, timestamp and other useful info.

## How to run example

1) Make sure MongoDB is installed & running locally

2) Install module dependencies:

```bash
npm install .
```
3) Start server:

```bash
node server
```

4) Visit http://localhost:8000/ in browser
