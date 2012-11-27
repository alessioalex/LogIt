$(function() {
  var source, domObject;

  "use strict";

  domObject = document.getElementById('tree');

  // On Firefox 6.0.2 for ex there is no reconnect event issued, so we
  // need to manually create one
  function checkHealth(interval) {
    if (source.readyState === EventSource.CLOSED) {
      console.log('disconnected');
      boot(interval);
    } else {
      setTimeout(function() {
        checkHealth(interval);
      }, interval);
    }
  }

  function boot(healthInterval) {
    if (window.EventSource) {
      source = new EventSource('/events');

      source.addEventListener('message', function(e) {
        var data, labeledData;

        try {
          data = JSON.parse(e.data);
        }
        catch (err) { }

        if (data) {
          labeledData = {};
          labeledData[data.msg] = data;
          domObject.innerHTML += treeIt.generate(labeledData);
        }
      }, false);

      source.addEventListener('open', function(e) {
        // Connection was opened.
        console.log('connected');
      }, false);

      source.addEventListener('error', function(e) {
        if (e.readyState === EventSource.CLOSED) {
          // Connection was closed.
          alert('connection closed');
        }
      }, false);

      checkHealth(healthInterval);
    } else {
      alert("Unfortunately Server Side events aren't available in your browser!");
    }
  }

  boot(5000);

  $('#tree').on('click', '.branchRoot', function(evt) {
    var that = $(this);

    that.next().slideToggle('fast');
    that.parent('.branch').toggleClass('opened');
  });

});
