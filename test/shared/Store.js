var LogIt = require('../../');

module.exports = function(store) {
  describe('#stream()', function() {
    // only when #steam() is implemented
    it("should emit 'data' event and stop the stream", function(done) {
      var log, stream, items;

      items  = [];
      log    = new LogIt({ store: store });
      stream = log.stream({ end: false, interval: 50 });

      stream.on('data', function(item) {
        items.push(item);
      }).on('end', function() {
        items.length.should.equal(2);
        items[0].msg.should.equal('shoot!');
        items[1].msg.should.equal('ouups!');

        log.info("this msg won't be streamed, since streaming stopped");

        setTimeout(function() {
          items.length.should.equal(2);
          done();
        }, 500);
      });

      setTimeout(function() {
        log.info('shoot!');
        log.warn('ouups!');
      }, 500);

      setTimeout(function() {
        stream.emit('stop');
      }, 1500);
    });
  });
};
