class JobWorker {
  constructor(name) {
    this.name = name;
  }
  onMessage(msg) {
    console.log(`worker ${this.name} got message `, msg);
    if (msg.name == 'stop') {
      process.removeAllListeners('message');
      return;
    }
    if (msg.name == 'run') {
      this.runCommand(msg.text);
    }
  }
  runCommand(text) {
    const [task, ...args] = text.trim().split(' ');
    if (task == 'remind') {
      const seconds = +args[0];
      setTimeout(() => process.send({ name: 'reminder' }), seconds * 1000);
    }
  }
  initialize() {
    process.on('message', msg => this.onMessage(msg));
    console.log(`starting worker ${this.name} with pid ${process.pid}`);
  }
}

const main = function() {
  const [, , name] = process.argv;
  const worker = new JobWorker(name);
  worker.initialize();
};

main();
